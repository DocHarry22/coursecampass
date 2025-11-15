const express = require('express');
const router = express.Router();
const AdvancedSearchService = require('../services/AdvancedSearchService');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/advanced-search/nlp
 * @desc    Natural language search
 * @access  Public
 */
router.get('/nlp', async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user?.id;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await AdvancedSearchService.nlpSearch(q, userId);

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('NLP search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/advanced-search/semantic
 * @desc    Semantic search with synonyms
 * @access  Public
 */
router.get('/semantic', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await AdvancedSearchService.semanticSearch(q);

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/advanced-search/ai-match
 * @desc    AI-powered course matching
 * @access  Private
 */
router.get('/ai-match', protect, async (req, res) => {
  try {
    const results = await AdvancedSearchService.aiCourseMatch(req.user.id);

    res.json({
      success: true,
      data: results,
      count: results.length,
      message: 'Courses matched based on your learning profile'
    });
  } catch (error) {
    console.error('AI match error:', error);
    res.status(500).json({
      success: false,
      message: 'AI matching failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/advanced-search/autocomplete
 * @desc    Search autocomplete suggestions
 * @access  Public
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await AdvancedSearchService.autocomplete(q, parseInt(limit));

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Autocomplete failed',
      error: error.message
    });
  }
});

module.exports = router;
