const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EmailService = require('../services/EmailService');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

/**
 * @route   POST /api/notifications/test
 * @desc    Send test email (development only)
 * @access  Private
 */
router.post('/test', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { type } = req.body;

    switch (type) {
      case 'enrollment':
        const course = await Course.findOne().populate('university');
        await EmailService.sendEnrollmentConfirmation(user, course);
        break;
      case 'completion':
        const completedCourse = await Course.findOne().populate('university');
        await EmailService.sendCompletionCertificate(user, completedCourse, 'https://example.com/certificate.pdf');
        break;
      case 'reminder':
        const reminderCourse = await Course.findOne().populate('university');
        await EmailService.sendDeadlineReminder(user, reminderCourse, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        break;
      case 'digest':
        const stats = { hoursThisWeek: 12, completedLectures: 8 };
        const recommendations = [];
        await EmailService.sendWeeklyDigest(user, stats, recommendations);
        break;
      default:
        return res.status(400).json({ success: false, error: 'Invalid email type' });
    }

    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/preferences', auth, async (req, res) => {
  try {
    const { emailNotifications } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Initialize notificationPreferences if it doesn't exist
    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }

    // Update preferences
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...emailNotifications
    };

    await user.save();

    res.json({
      success: true,
      data: user.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Default preferences if not set
    const defaultPreferences = {
      enrollment: true,
      completion: true,
      deadlines: true,
      newCourses: false,
      weeklyDigest: true,
      marketing: false
    };

    const preferences = user.notificationPreferences || defaultPreferences;

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/notifications/digest/trigger
 * @desc    Manually trigger weekly digest (admin only)
 * @access  Private/Admin
 */
router.post('/digest/trigger', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    // Get all users who have digest enabled
    const users = await User.find({ 
      'notificationPreferences.weeklyDigest': { $ne: false }
    });

    let sent = 0;
    let failed = 0;

    for (const targetUser of users) {
      try {
        // Calculate user stats
        const enrollments = await Enrollment.find({ 
          user: targetUser._id,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const stats = {
          hoursThisWeek: enrollments.reduce((sum, e) => sum + (e.progressMinutes || 0), 0) / 60,
          completedLectures: enrollments.reduce((sum, e) => sum + (e.completedLessons?.length || 0), 0)
        };

        // Get recommendations (simplified - you can enhance this)
        const recommendations = [];

        await EmailService.sendWeeklyDigest(targetUser, stats, recommendations);
        sent++;
      } catch (error) {
        console.error(`Failed to send digest to ${targetUser.email}:`, error);
        failed++;
      }
    }

    res.json({
      success: true,
      data: {
        sent,
        failed,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Error triggering weekly digest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
