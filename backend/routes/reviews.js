const express = require('express');
const router = express.Router();
const CourseReview = require('../models/CourseReview');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/reviews/course/:courseId
// @desc    Get all approved reviews for a course
// @access  Public
router.get('/course/:courseId', async (req, res) => {
  try {
    const { sort = 'recent', page = 1, limit = 10 } = req.query;
    
    let sortOption = {};
    switch (sort) {
      case 'helpful':
        sortOption = { helpfulCount: -1 };
        break;
      case 'rating-high':
        sortOption = { rating: -1 };
        break;
      case 'rating-low':
        sortOption = { rating: 1 };
        break;
      default: // recent
        sortOption = { createdAt: -1 };
    }
    
    const reviews = await CourseReview.find({
      course: req.params.courseId,
      status: 'approved'
    })
      .populate('user', 'firstName lastName avatar')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await CourseReview.countDocuments({
      course: req.params.courseId,
      status: 'approved'
    });
    
    const stats = await CourseReview.getAverageRating(req.params.courseId);
    
    res.json({
      success: true,
      data: reviews,
      stats,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      courseId,
      rating,
      title,
      content,
      ratings,
      wouldRecommend
    } = req.body;
    
    // Check if already reviewed
    const existingReview = await CourseReview.findOne({
      user: req.user.id,
      course: courseId
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this course'
      });
    }
    
    // Check if enrolled
    const enrollment = await Enrollment.findOne({
      user: req.user.id,
      course: courseId
    });
    
    const review = await CourseReview.create({
      user: req.user.id,
      course: courseId,
      rating,
      title,
      content,
      ratings,
      wouldRecommend,
      isVerifiedPurchase: !!enrollment,
      completionStatus: enrollment?.status || 'enrolled',
      status: 'approved' // Auto-approve for now; add moderation later
    });
    
    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.reviewsWritten': 1 }
    });
    
    const populatedReview = await CourseReview.findById(review._id)
      .populate('user', 'firstName lastName avatar');
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: populatedReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, title, content, ratings, wouldRecommend } = req.body;
    
    const review = await CourseReview.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Update fields
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (content) review.content = content;
    if (ratings) review.ratings = ratings;
    if (wouldRecommend !== undefined) review.wouldRecommend = wouldRecommend;
    
    review.isEdited = true;
    review.editedAt = new Date();
    review.status = 'pending'; // Re-moderate edited reviews
    
    await review.save();
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await CourseReview.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.reviewsWritten': -1 }
    });
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await CourseReview.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    review.markHelpful(req.user.id);
    await review.save();
    
    res.json({
      success: true,
      message: 'Marked as helpful',
      data: { helpfulCount: review.helpfulCount }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as helpful',
      error: error.message
    });
  }
});

// @route   POST /api/reviews/:id/not-helpful
// @desc    Mark review as not helpful
// @access  Private
router.post('/:id/not-helpful', protect, async (req, res) => {
  try {
    const review = await CourseReview.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    review.markNotHelpful(req.user.id);
    await review.save();
    
    res.json({
      success: true,
      message: 'Marked as not helpful',
      data: { helpfulCount: review.helpfulCount }
    });
  } catch (error) {
    console.error('Mark not helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as not helpful',
      error: error.message
    });
  }
});

// @route   POST /api/reviews/:id/flag
// @desc    Flag a review
// @access  Private
router.post('/:id/flag', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const review = await CourseReview.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if already flagged by this user
    const alreadyFlagged = review.flags.some(f => f.user.equals(req.user.id));
    if (alreadyFlagged) {
      return res.status(400).json({
        success: false,
        message: 'You have already flagged this review'
      });
    }
    
    review.flags.push({
      user: req.user.id,
      reason
    });
    
    // Auto-flag for moderation if multiple flags
    if (review.flags.length >= 3 && review.status === 'approved') {
      review.status = 'flagged';
    }
    
    await review.save();
    
    res.json({
      success: true,
      message: 'Review flagged for moderation'
    });
  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag review',
      error: error.message
    });
  }
});

// @route   GET /api/reviews/moderation/pending
// @desc    Get reviews pending moderation
// @access  Private (Admin/Moderator)
router.get('/moderation/pending', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const reviews = await CourseReview.find({
      status: { $in: ['pending', 'flagged'] }
    })
      .populate('user', 'firstName lastName email')
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reviews',
      error: error.message
    });
  }
});

// @route   PUT /api/reviews/:id/moderate
// @desc    Moderate a review
// @access  Private (Admin/Moderator)
router.put('/:id/moderate', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { status, moderationNotes } = req.body;
    
    const review = await CourseReview.findByIdAndUpdate(
      req.params.id,
      {
        status,
        moderationNotes,
        moderatedBy: req.user.id,
        moderatedAt: new Date()
      },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Review moderated successfully',
      data: review
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review',
      error: error.message
    });
  }
});

module.exports = router;
