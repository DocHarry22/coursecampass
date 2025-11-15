const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const EmailService = require('../services/EmailService');
const emailService = new EmailService();

// @route   GET /api/enrollments
// @desc    Get all enrollments for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { user: req.user.id };
    if (status) query.status = status;
    
    const enrollments = await Enrollment.find(query)
      .populate('course')
      .sort({ enrollmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Enrollment.countDocuments(query);
    
    res.json({
      success: true,
      data: enrollments,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments',
      error: error.message
    });
  }
});

// @route   GET /api/enrollments/stats
// @desc    Get enrollment statistics for current user
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const totalEnrollments = await Enrollment.countDocuments({ user: req.user.id });
    const completedEnrollments = await Enrollment.countDocuments({ 
      user: req.user.id, 
      status: 'completed' 
    });
    const inProgressEnrollments = await Enrollment.countDocuments({ 
      user: req.user.id, 
      status: 'in-progress' 
    });
    
    // Calculate total time spent
    const enrollments = await Enrollment.find({ user: req.user.id });
    const totalTimeSpent = enrollments.reduce((sum, e) => sum + (e.timeSpent.total || 0), 0);
    
    // Calculate average progress
    const avgProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress.percentage, 0) / enrollments.length
      : 0;
    
    res.json({
      success: true,
      data: {
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments,
        totalTimeSpent, // in minutes
        averageProgress: Math.round(avgProgress),
        completionRate: totalEnrollments > 0 
          ? Math.round((completedEnrollments / totalEnrollments) * 100)
          : 0
      }
    });
  } catch (error) {
    console.error('Get enrollment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// @route   POST /api/enrollments
// @desc    Enroll in a course
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { courseId, paymentInfo } = req.body;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user.id,
      course: courseId
    });
    
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }
    
    // Create enrollment
    const enrollment = await Enrollment.create({
      user: req.user.id,
      course: courseId,
      status: 'enrolled',
      payment: paymentInfo
    });
    
    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.coursesEnrolled': 1 }
    });
    
    const populatedEnrollment = await Enrollment.findById(enrollment._id).populate('course');
    
    // Send enrollment confirmation email
    try {
      const user = await User.findById(req.user.id);
      const courseWithUni = await Course.findById(courseId).populate('university');
      await emailService.sendEnrollmentConfirmation(user, courseWithUni);
    } catch (emailError) {
      console.error('Failed to send enrollment email:', emailError);
      // Don't fail the enrollment if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: populatedEnrollment
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Enrollment failed',
      error: error.message
    });
  }
});

// @route   GET /api/enrollments/:id
// @desc    Get enrollment details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('course');
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollment',
      error: error.message
    });
  }
});

// @route   PUT /api/enrollments/:id/progress
// @desc    Update enrollment progress
// @access  Private
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { completedLectures, completedAssignments, timeSpent } = req.body;
    
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    // Update progress
    if (completedLectures !== undefined) {
      enrollment.progress.completedLectures = completedLectures;
    }
    if (completedAssignments !== undefined) {
      enrollment.progress.completedAssignments = completedAssignments;
    }
    
    // Add time spent
    if (timeSpent) {
      enrollment.addTimeSpent(timeSpent);
    }
    
    // Recalculate progress percentage
    enrollment.updateProgress();
    
    // Update status to in-progress if it was enrolled
    if (enrollment.status === 'enrolled') {
      enrollment.status = 'in-progress';
    }
    
    await enrollment.save();
    
    // Update user stats if completed
    if (enrollment.status === 'completed') {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 
          'stats.coursesCompleted': 1,
          'stats.totalLearningHours': Math.round(enrollment.timeSpent.total / 60)
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
});

// @route   PUT /api/enrollments/:id/status
// @desc    Update enrollment status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['enrolled', 'in-progress', 'completed', 'dropped', 'paused'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status },
      { new: true }
    ).populate('course');
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    // Send completion email if status changed to completed
    if (status === 'completed') {
      try {
        const user = await User.findById(req.user.id);
        const courseWithUni = await Course.findById(enrollment.course._id).populate('university');
        // Certificate URL would be generated by a separate service
        const certificateUrl = `${process.env.FRONTEND_URL}/certificates/${enrollment._id}`;
        await emailService.sendCompletionCertificate(user, courseWithUni, certificateUrl);
      } catch (emailError) {
        console.error('Failed to send completion email:', emailError);
      }
      
      // Update user stats
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'stats.coursesCompleted': 1 }
      });
    }
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

// @route   POST /api/enrollments/:id/notes
// @desc    Add a note to enrollment
// @access  Private
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const { content, lectureId, timestamp } = req.body;
    
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    enrollment.notes.push({
      content,
      lectureId,
      timestamp
    });
    
    await enrollment.save();
    
    res.json({
      success: true,
      message: 'Note added successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
});

module.exports = router;



