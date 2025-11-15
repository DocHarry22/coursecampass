const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const University = require('../models/University');
const Category = require('../models/Category');
const Instructor = require('../models/Instructor');

// @route   GET /api/courses
// @desc    Get all courses with pagination and filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      university,
      category,
      deliveryMode,
      priceType,
      minPrice,
      maxPrice,
      level,
      language,
      search,
      isFeatured,
      minRating
    } = req.query;

    // Build filter object
    const filter = { isActive: true, verificationStatus: 'approved' };

    if (university) filter.university = university;
    if (category) filter.category = category;
    if (deliveryMode) filter.deliveryMode = deliveryMode;
    if (priceType) filter['pricing.type'] = priceType;
    if (level) filter.level = level;
    if (language) filter.language = language;
    if (isFeatured) filter.isFeatured = isFeatured === 'true';
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter['pricing.amount'] = {};
      if (minPrice) filter['pricing.amount'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.amount'].$lte = Number(maxPrice);
    }

    // Rating filter
    if (minRating) {
      filter['ratings.average'] = { $gte: Number(minRating) };
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query with population
    const courses = await Course.find(filter)
      .populate('university', 'name slug logoUrl location.country')
      .populate('category', 'name slug')
      .populate('instructors.instructor', 'firstName lastName title')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: courses,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course by ID or slug
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find by ID or slug
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { slug: id };

    const course = await Course.findOne(query)
      .populate('university', 'name slug logoUrl description location contact websiteUrl isVerified')
      .populate('category', 'name slug description')
      .populate('instructors.instructor', 'firstName lastName title bio profileImageUrl professionalLinks')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Increment view count
    await Course.findByIdAndUpdate(course._id, {
      $inc: { 'stats.viewCount': 1 }
    });

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Admin/Partner)
router.post('/', async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();

    // Update university course count
    await University.findByIdAndUpdate(course.university, {
      $inc: { 'stats.totalCourses': 1 }
    });

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (Admin/Partner)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
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
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update university course count
    await University.findByIdAndUpdate(course.university, {
      $inc: { 'stats.totalCourses': -1 }
    });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
});

module.exports = router;
