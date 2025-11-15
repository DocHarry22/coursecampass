const express = require('express');
const router = express.Router();
const RecommendationEngine = require('../services/RecommendationEngine');
const { protect } = require('../middleware/auth');

// @route   GET /api/recommendations
// @desc    Get personalized recommendations for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = await RecommendationEngine.getRecommendations(
      req.user.id,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

// @route   GET /api/recommendations/trending
// @desc    Get trending courses
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const trending = await RecommendationEngine.getTrendingCourses(parseInt(limit));
    
    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Get trending courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending courses',
      error: error.message
    });
  }
});

// @route   GET /api/recommendations/beginners
// @desc    Get beginner-friendly courses
// @access  Public
router.get('/beginners', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const courses = await RecommendationEngine.getBeginnerCourses(parseInt(limit));
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Get beginner courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beginner courses',
      error: error.message
    });
  }
});

module.exports = router;
