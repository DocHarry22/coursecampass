const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const { protect } = require('../middleware/auth');

// @route   GET /api/favorites
// @desc    Get all favorites for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { collection } = req.query;
    
    const query = { user: req.user.id };
    if (collection) query.collection = collection;
    
    const favorites = await Favorite.find(query)
      .populate('course')
      .sort({ addedAt: -1 });
    
    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
      error: error.message
    });
  }
});

// @route   GET /api/favorites/collections
// @desc    Get all collections for current user
// @access  Private
router.get('/collections', protect, async (req, res) => {
  try {
    const collections = await Favorite.distinct('collection', { user: req.user.id });
    
    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections',
      error: error.message
    });
  }
});

// @route   POST /api/favorites
// @desc    Add course to favorites
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { courseId, collection, notes } = req.body;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }
    
    // Check if already in favorites
    const existing = await Favorite.findOne({
      user: req.user.id,
      course: courseId
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Course already in favorites'
      });
    }
    
    const favorite = await Favorite.create({
      user: req.user.id,
      course: courseId,
      collection: collection || 'default',
      notes
    });
    
    const populatedFavorite = await Favorite.findById(favorite._id).populate('course');
    
    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      data: populatedFavorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites',
      error: error.message
    });
  }
});

// @route   DELETE /api/favorites/:courseId
// @desc    Remove course from favorites
// @access  Private
router.delete('/:courseId', protect, async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      user: req.user.id,
      course: req.params.courseId
    });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message
    });
  }
});

// @route   PUT /api/favorites/:courseId
// @desc    Update favorite (collection or notes)
// @access  Private
router.put('/:courseId', protect, async (req, res) => {
  try {
    const { collection, notes } = req.body;
    
    const updateData = {};
    if (collection) updateData.collection = collection;
    if (notes !== undefined) updateData.notes = notes;
    
    const favorite = await Favorite.findOneAndUpdate(
      { user: req.user.id, course: req.params.courseId },
      updateData,
      { new: true }
    ).populate('course');
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Favorite updated',
      data: favorite
    });
  } catch (error) {
    console.error('Update favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update favorite',
      error: error.message
    });
  }
});

module.exports = router;
