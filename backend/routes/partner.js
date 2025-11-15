const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const University = require('../models/University');
const PartnerApiKey = require('../models/PartnerApiKey');
const { authenticatePartner, requirePermission } = require('../middleware/partnerAuth');

// All routes require authentication
router.use(authenticatePartner);

// @route   POST /api/partner/courses
// @desc    Create a new course (partner submission)
// @access  Partner (create permission)
router.post('/courses', requirePermission('create'), async (req, res) => {
  try {
    const courseData = req.body;

    // Ensure course belongs to partner's university
    courseData.university = req.partner.university._id;
    courseData.verificationStatus = 'pending'; // Requires admin approval
    courseData.source = 'partner_api';

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      message: 'Course created successfully. Awaiting approval.',
      data: course
    });
  } catch (error) {
    console.error('Error creating partner course:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
});

// @route   GET /api/partner/courses
// @desc    Get partner's courses
// @access  Partner (read permission)
router.get('/courses', requirePermission('read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { university: req.partner.university._id };
    
    if (status) {
      query.verificationStatus = status;
    }

    const courses = await Course.find(query)
      .populate('categories', 'name')
      .populate('instructors', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
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

// @route   PUT /api/partner/courses/:id
// @desc    Update partner's course
// @access  Partner (update permission)
router.put('/courses/:id', requirePermission('update'), async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      university: req.partner.university._id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Update course but reset verification status
    Object.assign(course, req.body);
    course.verificationStatus = 'pending';
    course.university = req.partner.university._id; // Prevent changing university
    
    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully. Awaiting approval.',
      data: course
    });
  } catch (error) {
    console.error('Error updating partner course:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update course',
      error: error.message
    });
  }
});

// @route   DELETE /api/partner/courses/:id
// @desc    Delete partner's course
// @access  Partner (delete permission)
router.delete('/courses/:id', requirePermission('delete'), async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      university: req.partner.university._id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    await course.deleteOne();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting partner course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message
    });
  }
});

// @route   POST /api/partner/courses/bulk
// @desc    Bulk upload courses
// @access  Partner (create permission)
router.post('/courses/bulk', requirePermission('create'), async (req, res) => {
  try {
    const { courses } = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. Expected array of courses.'
      });
    }

    if (courses.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 courses per bulk upload'
      });
    }

    // Add university and verification status to all courses
    const coursesWithDefaults = courses.map(c => ({
      ...c,
      university: req.partner.university._id,
      verificationStatus: 'pending',
      source: 'partner_api_bulk'
    }));

    const results = {
      successful: [],
      failed: []
    };

    for (const courseData of coursesWithDefaults) {
      try {
        const course = await Course.create(courseData);
        results.successful.push({ id: course._id, title: course.title });
      } catch (error) {
        results.failed.push({
          title: courseData.title,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk upload completed. ${results.successful.length} courses created, ${results.failed.length} failed.`,
      results
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk upload failed',
      error: error.message
    });
  }
});

// @route   GET /api/partner/analytics
// @desc    Get partner course analytics
// @access  Partner (analytics permission)
router.get('/analytics', requirePermission('analytics'), async (req, res) => {
  try {
    const universityId = req.partner.university._id;

    const [totalCourses, approvedCourses, pendingCourses, rejectedCourses] = await Promise.all([
      Course.countDocuments({ university: universityId }),
      Course.countDocuments({ university: universityId, verificationStatus: 'approved' }),
      Course.countDocuments({ university: universityId, verificationStatus: 'pending' }),
      Course.countDocuments({ university: universityId, verificationStatus: 'rejected' })
    ]);

    // Get course views and enrollment stats
    const courses = await Course.find({ university: universityId });
    const totalViews = courses.reduce((sum, c) => sum + (c.stats?.views || 0), 0);
    const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrollment?.currentEnrollment || 0), 0);

    // Top performing courses
    const topCourses = await Course.find({ university: universityId })
      .sort({ 'stats.views': -1 })
      .limit(10)
      .select('title stats.views averageRating enrollment.currentEnrollment');

    res.json({
      success: true,
      data: {
        overview: {
          totalCourses,
          approvedCourses,
          pendingCourses,
          rejectedCourses,
          totalViews,
          totalEnrolled
        },
        topCourses,
        university: {
          name: req.partner.university.name,
          stats: req.partner.university.stats
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// @route   GET /api/partner/api-usage
// @desc    Get API usage statistics
// @access  Partner (read permission)
router.get('/api-usage', requirePermission('read'), async (req, res) => {
  try {
    const apiKey = await PartnerApiKey.findById(req.partner.id);

    res.json({
      success: true,
      data: {
        usage: apiKey.usage,
        rateLimit: apiKey.rateLimit,
        permissions: apiKey.permissions,
        university: req.partner.university.name
      }
    });
  } catch (error) {
    console.error('Error fetching API usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API usage',
      error: error.message
    });
  }
});

module.exports = router;
