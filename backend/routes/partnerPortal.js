const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const CourseReview = require('../models/CourseReview');
const PartnerApiKey = require('../models/PartnerApiKey');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// Middleware to check instructor/admin role
const isPartner = async (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Partner privileges required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/partner-portal/courses
 * @desc    Get all courses for authenticated partner
 * @access  Private/Partner
 */
router.get('/courses', protect, isPartner, async (req, res) => {
  try {
    const courses = await Course.find({
      $or: [
        { 'instructors.instructor': req.user.id },
        { createdBy: req.user.id }
      ]
    }).populate('university').populate('instructors.instructor');

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching partner courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/partner-portal/courses
 * @desc    Create new course
 * @access  Private/Partner
 */
router.post('/courses', protect, isPartner, async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      createdBy: req.user.id,
      instructors: [{ instructor: req.user.id, role: 'lead' }]
    };

    const course = await Course.create(courseData);
    
    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/partner-portal/courses/:id
 * @desc    Update course
 * @access  Private/Partner
 */
router.put('/courses/:id', protect, isPartner, async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { 'instructors.instructor': req.user.id },
          { createdBy: req.user.id }
        ]
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or unauthorized'
      });
    }

    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/partner-portal/courses/:id
 * @desc    Delete course
 * @access  Private/Partner
 */
router.delete('/courses/:id', protect, isPartner, async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { 'instructors.instructor': req.user.id },
        { createdBy: req.user.id }
      ]
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/partner-portal/analytics
 * @desc    Get analytics for partner's courses
 * @access  Private/Partner
 */
router.get('/analytics', protect, isPartner, async (req, res) => {
  try {
    // Get partner's courses
    const partnerCourses = await Course.find({
      $or: [
        { 'instructors.instructor': req.user.id },
        { createdBy: req.user.id }
      ]
    });
    const courseIds = partnerCourses.map(c => c._id);

    // Get enrollments
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });

    // Get reviews
    const reviews = await CourseReview.find({
      course: { $in: courseIds },
      status: 'approved'
    });

    // Calculate analytics
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    // Get unique active students
    const activeStudents = new Set(
      enrollments.filter(e => e.status === 'in-progress').map(e => e.student.toString())
    ).size;

    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentEnrollments = enrollments.filter(
      e => new Date(e.enrollmentDate) >= thirtyDaysAgo
    ).length;

    // Top courses
    const topCourses = partnerCourses.map(course => {
      const courseEnrollments = enrollments.filter(
        e => e.course.toString() === course._id.toString()
      );
      const courseReviews = reviews.filter(
        r => r.course.toString() === course._id.toString()
      );
      return {
        title: course.title,
        enrollments: courseEnrollments.length,
        rating: courseReviews.length > 0 
          ? courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length 
          : 0
      };
    }).sort((a, b) => b.enrollments - a.enrollments);

    res.json({
      success: true,
      data: {
        totalCourses: partnerCourses.length,
        totalEnrollments,
        averageRating,
        activeStudents,
        completionRate: totalEnrollments > 0 
          ? (completedEnrollments / totalEnrollments * 100) 
          : 0,
        recentEnrollments,
        averageProgress: enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length || 0,
        topCourses: topCourses.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error fetching partner analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/partner-portal/api-keys
 * @desc    Get all API keys for partner
 * @access  Private/Partner
 */
router.get('/api-keys', protect, isPartner, async (req, res) => {
  try {
    const apiKeys = await PartnerApiKey.find({ createdBy: req.user.id });
    
    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/partner-portal/api-keys/generate
 * @desc    Generate new API key
 * @access  Private/Partner
 */
router.post('/api-keys/generate', protect, isPartner, async (req, res) => {
  try {
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    const newKey = await PartnerApiKey.create({
      university: req.user.university,
      key: apiKey,
      name: req.body.name || 'Default API Key',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: newKey,
      message: 'API key generated successfully'
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API key',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/partner-portal/api-keys/:id/revoke
 * @desc    Revoke API key
 * @access  Private/Partner
 */
router.put('/api-keys/:id/revoke', protect, isPartner, async (req, res) => {
  try {
    const apiKey = await PartnerApiKey.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    res.json({
      success: true,
      data: apiKey,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key',
      error: error.message
    });
  }
});

module.exports = router;
