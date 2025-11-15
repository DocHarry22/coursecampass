const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const CourseReview = require('../models/CourseReview');
const { protect } = require('../middleware/auth');

// Middleware to check admin role
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
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
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private/Admin
 */
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      pendingReviews,
      flaggedReviews,
      activeUsers
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      CourseReview.countDocuments({ status: 'pending' }),
      CourseReview.countDocuments({ status: 'flagged' }),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        pendingReviews,
        flaggedReviews,
        activeUsers
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Private/Admin
 */
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, status, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.accountStatus = status;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Private/Admin
 */
router.put('/users/:id/role', protect, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['student', 'instructor', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/suspend
 * @desc    Suspend user account
 * @access  Private/Admin
 */
router.put('/users/:id/suspend', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: 'suspended' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/activate
 * @desc    Activate user account
 * @access  Private/Admin
 */
router.put('/users/:id/activate', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: 'active' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user account (soft delete)
 * @access  Private/Admin
 */
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: 'deleted', deletedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/courses/pending
 * @desc    Get pending course approvals
 * @access  Private/Admin
 */
router.get('/courses/pending', protect, isAdmin, async (req, res) => {
  try {
    const courses = await Course.find({ status: 'pending' })
      .populate('university')
      .populate('instructors.instructor')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching pending courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending courses',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/courses/:id/approve
 * @desc    Approve course
 * @access  Private/Admin
 */
router.put('/courses/:id/approve', protect, isAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course,
      message: 'Course approved successfully'
    });
  } catch (error) {
    console.error('Error approving course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve course',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/courses/:id/reject
 * @desc    Reject course
 * @access  Private/Admin
 */
router.put('/courses/:id/reject', protect, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectionReason: reason
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course,
      message: 'Course rejected'
    });
  } catch (error) {
    console.error('Error rejecting course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject course',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/analytics
 * @desc    Get platform analytics
 * @access  Private/Admin
 */
router.get('/analytics', protect, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // User growth
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

    // Top courses
    const topCourses = await Enrollment.aggregate([
      { $match: dateFilter },
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

    // User roles distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        userGrowth,
        enrollmentTrends,
        topCourses,
        roleDistribution
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

module.exports = router;
