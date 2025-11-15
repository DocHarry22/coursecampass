const express = require('express');
const router = express.Router();
const University = require('../models/University');
const Course = require('../models/Course');

// @route   GET /api/universities
// @desc    Get all universities with pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'name',
      country,
      institutionType,
      isPartner,
      isVerified,
      search
    } = req.query;

    // Build filter object
    const filter = {};

    if (country) filter['location.country'] = country;
    if (institutionType) filter.institutionType = institutionType;
    if (isPartner !== undefined) filter.isPartner = isPartner === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const universities = await University.find(filter)
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // Get total count
    const total = await University.countDocuments(filter);

    res.json({
      success: true,
      data: universities,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching universities',
      error: error.message
    });
  }
});

// @route   GET /api/universities/:id
// @desc    Get single university by ID or slug
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find by ID or slug
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { slug: id };

    const university = await University.findOne(query).lean();

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    res.json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error('Error fetching university:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching university',
      error: error.message
    });
  }
});

// @route   GET /api/universities/:id/courses
// @desc    Get all courses for a specific university
// @access  Public
router.get('/:id/courses', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      deliveryMode,
      priceType,
      level,
      isActive = true
    } = req.query;

    // Find university first
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { slug: id };
    
    const university = await University.findOne(query);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    // Build course filter
    const filter = { 
      university: university._id,
      isActive: isActive === 'true',
      verificationStatus: 'approved'
    };

    if (deliveryMode) filter.deliveryMode = deliveryMode;
    if (priceType) filter['pricing.type'] = priceType;
    if (level) filter.level = level;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch courses
    const courses = await Course.find(filter)
      .populate('category', 'name slug')
      .populate('instructors.instructor', 'firstName lastName title')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // Get total count
    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: {
        university,
        courses
      },
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching university courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching university courses',
      error: error.message
    });
  }
});

// @route   POST /api/universities
// @desc    Create a new university
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    const university = new University(req.body);
    await university.save();

    res.status(201).json({
      success: true,
      data: university,
      message: 'University created successfully'
    });
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating university',
      error: error.message
    });
  }
});

// @route   PUT /api/universities/:id
// @desc    Update a university
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const university = await University.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    res.json({
      success: true,
      data: university,
      message: 'University updated successfully'
    });
  } catch (error) {
    console.error('Error updating university:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating university',
      error: error.message
    });
  }
});

// @route   DELETE /api/universities/:id
// @desc    Delete a university
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const university = await University.findByIdAndDelete(id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    // Note: Courses will be cascade deleted due to MongoDB reference
    // You may want to handle this differently depending on requirements

    res.json({
      success: true,
      message: 'University deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting university',
      error: error.message
    });
  }
});

module.exports = router;
