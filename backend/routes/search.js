const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// @route   POST /api/courses/search
// @desc    Advanced search with multiple filters
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      // Pagination
      page = 1,
      limit = 20,
      sort = '-createdAt',
      
      // Filters
      universities = [],
      categories = [],
      regions = [],
      deliveryModes = [],
      priceTypes = [],
      minPrice,
      maxPrice,
      levels = [],
      languages = [],
      minRating,
      minDuration,
      maxDuration,
      durationUnit,
      startDateFrom,
      startDateTo,
      minCredits,
      maxCredits,
      accessibilityFeatures = [],
      certificationTypes = [],
      isFeatured,
      isSelfPaced,
      
      // Text search
      searchQuery
    } = req.body;

    // Build filter object
    const filter = { isActive: true, verificationStatus: 'approved' };

    // University filter (array)
    if (universities.length > 0) {
      filter.university = { $in: universities };
    }

    // Category filter (array)
    if (categories.length > 0) {
      filter.category = { $in: categories };
    }

    // Delivery mode filter (array)
    if (deliveryModes.length > 0) {
      filter.deliveryMode = { $in: deliveryModes };
    }

    // Price type filter (array)
    if (priceTypes.length > 0) {
      filter['pricing.type'] = { $in: priceTypes };
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['pricing.amount'] = {};
      if (minPrice !== undefined) filter['pricing.amount'].$gte = Number(minPrice);
      if (maxPrice !== undefined) filter['pricing.amount'].$lte = Number(maxPrice);
    }

    // Level filter (array)
    if (levels.length > 0) {
      filter.level = { $in: levels };
    }

    // Language filter (array)
    if (languages.length > 0) {
      filter.language = { $in: languages };
    }

    // Rating filter
    if (minRating) {
      filter['ratings.average'] = { $gte: Number(minRating) };
    }

    // Duration filter
    if (minDuration !== undefined || maxDuration !== undefined) {
      if (durationUnit) {
        filter['duration.unit'] = durationUnit;
      }
      filter['duration.value'] = {};
      if (minDuration !== undefined) filter['duration.value'].$gte = Number(minDuration);
      if (maxDuration !== undefined) filter['duration.value'].$lte = Number(maxDuration);
    }

    // Start date filter
    if (startDateFrom || startDateTo) {
      filter['schedule.startDate'] = {};
      if (startDateFrom) filter['schedule.startDate'].$gte = new Date(startDateFrom);
      if (startDateTo) filter['schedule.startDate'].$lte = new Date(startDateTo);
    }

    // Credits filter
    if (minCredits !== undefined || maxCredits !== undefined) {
      filter.credits = {};
      if (minCredits !== undefined) filter.credits.$gte = Number(minCredits);
      if (maxCredits !== undefined) filter.credits.$lte = Number(maxCredits);
    }

    // Accessibility features filter (array - must have all)
    if (accessibilityFeatures.length > 0) {
      filter.accessibilityFeatures = { $all: accessibilityFeatures };
    }

    // Certification types filter (array)
    if (certificationTypes.length > 0) {
      filter['certification.type'] = { $in: certificationTypes };
    }

    // Featured filter
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    // Self-paced filter
    if (isSelfPaced !== undefined) {
      filter.isSelfPaced = isSelfPaced;
    }

    // Region filter (requires joining with University)
    if (regions.length > 0) {
      const University = require('../models/University');
      const universitiesInRegion = await University.find({
        'location.region': { $in: regions }
      }).select('_id');
      
      const regionUniIdMap = new Map(universitiesInRegion.map((u) => [u._id.toString(), u._id]));
      const regionIdStrings = Array.from(regionUniIdMap.keys());

      if (filter.university) {
        // Normalize current filter to array form
        let currentIds = [];
        if (filter.university.$in) {
          currentIds = filter.university.$in.map((id) => id.toString());
        } else if (filter.university.$eq || filter.university.$in === undefined) {
          const singleId = filter.university.$eq || filter.university;
          if (singleId) currentIds = [singleId.toString()];
        }

        const intersection = currentIds
          .filter((id) => regionIdStrings.includes(id))
          .map((id) => regionUniIdMap.get(id))
          .filter(Boolean);
        filter.university = { $in: intersection };
      } else {
        filter.university = { $in: Array.from(regionUniIdMap.values()) };
      }
    }

    // Text search
    if (searchQuery && searchQuery.trim()) {
      filter.$text = { $search: searchQuery };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Determine sort order
    let sortOption = {};
    if (searchQuery && searchQuery.trim()) {
      sortOption.score = { $meta: 'textScore' };
    }
    
    // Parse sort parameter
    const sortFields = sort.split(',');
    sortFields.forEach(field => {
      if (field.startsWith('-')) {
        sortOption[field.substring(1)] = -1;
      } else {
        sortOption[field] = 1;
      }
    });

    // Execute query
    const courses = await Course.find(filter)
      .populate('university', 'name slug logoUrl location.country isVerified')
      .populate('category', 'name slug')
      .populate('instructors.instructor', 'firstName lastName title')
      .sort(sortOption)
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // Get total count
    const total = await Course.countDocuments(filter);

    // Get aggregated filter statistics
    const stats = await Course.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$pricing.amount' },
          minPrice: { $min: '$pricing.amount' },
          maxPrice: { $max: '$pricing.amount' },
          avgRating: { $avg: '$ratings.average' },
          totalCourses: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: courses,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      },
      stats: stats[0] || {
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgRating: 0,
        totalCourses: 0
      }
    });
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching courses',
      error: error.message
    });
  }
});

module.exports = router;
