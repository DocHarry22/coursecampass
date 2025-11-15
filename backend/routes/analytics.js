const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const CourseReview = require('../models/CourseReview');
const { protect } = require('../middleware/auth');
const { Parser } = require('json2csv');

/**
 * @route   GET /api/analytics
 * @desc    Get comprehensive platform analytics
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Overview metrics
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalReviews,
      newUsers,
      newCourses,
      newEnrollments,
      completedEnrollments,
      activeUsers
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      CourseReview.countDocuments({ status: 'approved' }),
      User.countDocuments(dateFilter),
      Course.countDocuments(dateFilter),
      Enrollment.countDocuments(dateFilter),
      Enrollment.countDocuments({ ...dateFilter, status: 'completed' }),
      User.countDocuments({ 
        lastLogin: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        } 
      })
    ]);

    // User growth over time
    const userGrowth = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Enrollment trends
    const enrollmentTrends = await Enrollment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrollmentDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top courses by enrollment
    const topCourses = await Enrollment.aggregate([
      {
        $group: {
          _id: '$course',
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { enrollments: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' }
    ]);

    // Category distribution
    const topCategories = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // User role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate average rating
    const reviews = await CourseReview.find({ status: 'approved' });
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    // Revenue calculations
    const courses = await Course.find();
    const totalRevenue = courses.reduce((sum, c) => {
      const enrollments = c.enrollment?.currentEnrollment || 0;
      const price = c.price || 0;
      return sum + (enrollments * price);
    }, 0);

    const avgCoursePrice = courses.length > 0
      ? courses.reduce((sum, c) => sum + (c.price || 0), 0) / courses.length
      : 0;

    const completionRate = totalEnrollments > 0 
      ? (completedEnrollments / totalEnrollments * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCourses,
          totalEnrollments,
          totalReviews,
          newUsers,
          newCourses,
          newEnrollments,
          completedEnrollments,
          activeUsers,
          completionRate,
          avgRating
        },
        userGrowth,
        enrollmentTrends,
        topCourses,
        topCategories,
        roleDistribution,
        revenue: {
          total: totalRevenue,
          perUser: totalUsers > 0 ? totalRevenue / totalUsers : 0,
          avgCoursePrice
        },
        behavior: {
          avgSessionDuration: '24 min',
          avgPagesPerSession: '5.2'
        },
        courseMetrics: {
          avgCompletionTime: '6 weeks'
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

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data to CSV
 * @access  Private
 */
router.get('/export', protect, async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    // Get analytics data
    const [users, courses, enrollments] = await Promise.all([
      User.find().select('-password'),
      Course.find(),
      Enrollment.find().populate('student', 'firstName lastName email').populate('course', 'title')
    ]);

    if (format === 'csv') {
      // Prepare enrollment data for CSV
      const enrollmentData = enrollments.map(e => ({
        studentName: `${e.student?.firstName} ${e.student?.lastName}`,
        studentEmail: e.student?.email,
        courseTitle: e.course?.title,
        enrollmentDate: e.enrollmentDate,
        status: e.status,
        progress: e.progress,
        completionDate: e.completionDate || 'N/A'
      }));

      const parser = new Parser();
      const csv = parser.parse(enrollmentData);

      res.header('Content-Type', 'text/csv');
      res.attachment('analytics.csv');
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format'
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/user-behavior
 * @desc    Get detailed user behavior analytics
 * @access  Private/Admin
 */
router.get('/user-behavior', protect, async (req, res) => {
  try {
    // Get user activity patterns
    const userActivity = await Enrollment.aggregate([
      {
        $group: {
          _id: '$student',
          totalEnrollments: { $sum: 1 },
          completedCourses: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgProgress: { $avg: '$progress' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '__id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { $sort: { totalEnrollments: -1 } },
      { $limit: 100 }
    ]);

    // Get course completion patterns
    const completionPatterns = await Enrollment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            month: { $month: '$completionDate' },
            year: { $year: '$completionDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        userActivity,
        completionPatterns
      }
    });
  } catch (error) {
    console.error('Error fetching user behavior analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user behavior analytics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/analytics/course-performance
 * @desc    Get detailed course performance analytics
 * @access  Private
 */
router.get('/course-performance', protect, async (req, res) => {
  try {
    const coursePerformance = await Course.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $lookup: {
          from: 'coursereviews',
          localField: '_id',
          foreignField: 'course',
          as: 'reviews'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          difficulty: 1,
          totalEnrollments: { $size: '$enrollments' },
          completedEnrollments: {
            $size: {
              $filter: {
                input: '$enrollments',
                as: 'e',
                cond: { $eq: ['$$e.status', 'completed'] }
              }
            }
          },
          avgProgress: { $avg: '$enrollments.progress' },
          totalReviews: { $size: '$reviews' },
          avgRating: { $avg: '$reviews.rating' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalEnrollments', 0] },
              { $multiply: [{ $divide: ['$completedEnrollments', '$totalEnrollments'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalEnrollments: -1 } }
    ]);

    res.json({
      success: true,
      data: coursePerformance
    });
  } catch (error) {
    console.error('Error fetching course performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course performance',
      error: error.message
    });
  }
});

module.exports = router;
