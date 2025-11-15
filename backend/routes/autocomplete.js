const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const University = require('../models/University');
const Category = require('../models/Category');
const Instructor = require('../models/Instructor');

// @route   GET /api/autocomplete/courses
// @desc    Get course title suggestions for autocomplete
// @access  Public
router.get('/courses', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Use regex for partial matching (case-insensitive)
    const regex = new RegExp(q.trim(), 'i');

    const suggestions = await Course.find({
      $or: [
        { title: regex },
        { courseCode: regex }
      ],
      isActive: true,
      verificationStatus: 'approved'
    })
      .select('title courseCode slug university')
      .populate('university', 'name')
      .limit(Number(limit))
      .lean();

    const formatted = suggestions.map(course => ({
      type: 'course',
      id: course._id,
      title: course.title,
      courseCode: course.courseCode,
      university: course.university?.name,
      slug: course.slug
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching course suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions',
      error: error.message
    });
  }
});

// @route   GET /api/autocomplete/universities
// @desc    Get university name suggestions for autocomplete
// @access  Public
router.get('/universities', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const regex = new RegExp(q.trim(), 'i');

    const suggestions = await University.find({
      name: regex
    })
      .select('name slug location.country location.city logoUrl')
      .limit(Number(limit))
      .lean();

    const formatted = suggestions.map(uni => ({
      type: 'university',
      id: uni._id,
      name: uni.name,
      location: uni.location?.country,
      city: uni.location?.city,
      slug: uni.slug,
      logo: uni.logoUrl
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching university suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions',
      error: error.message
    });
  }
});

// @route   GET /api/autocomplete/categories
// @desc    Get category suggestions for autocomplete
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const regex = new RegExp(q.trim(), 'i');

    const suggestions = await Category.find({
      name: regex
    })
      .select('name slug level parent')
      .populate('parent', 'name')
      .limit(Number(limit))
      .lean();

    const formatted = suggestions.map(cat => ({
      type: 'category',
      id: cat._id,
      name: cat.name,
      level: cat.level,
      parent: cat.parent?.name,
      slug: cat.slug
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching category suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions',
      error: error.message
    });
  }
});

// @route   GET /api/autocomplete/instructors
// @desc    Get instructor name suggestions for autocomplete
// @access  Public
router.get('/instructors', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const regex = new RegExp(q.trim(), 'i');

    const suggestions = await Instructor.find({
      $or: [
        { firstName: regex },
        { lastName: regex }
      ]
    })
      .select('firstName lastName title university')
      .populate('university', 'name')
      .limit(Number(limit))
      .lean();

    const formatted = suggestions.map(instructor => ({
      type: 'instructor',
      id: instructor._id,
      name: `${instructor.firstName} ${instructor.lastName}`,
      title: instructor.title,
      university: instructor.university?.name
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching instructor suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions',
      error: error.message
    });
  }
});

// @route   GET /api/autocomplete/all
// @desc    Get combined suggestions from all types
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          courses: [],
          universities: [],
          categories: [],
          instructors: []
        }
      });
    }

    const regex = new RegExp(q.trim(), 'i');
    const itemsPerType = Math.ceil(Number(limit) / 4);

    // Fetch all in parallel
    const [courses, universities, categories, instructors] = await Promise.all([
      Course.find({
        $or: [
          { title: regex },
          { courseCode: regex }
        ],
        isActive: true,
        verificationStatus: 'approved'
      })
        .select('title courseCode slug university')
        .populate('university', 'name')
        .limit(itemsPerType)
        .lean(),

      University.find({ name: regex })
        .select('name slug location.country location.city')
        .limit(itemsPerType)
        .lean(),

      Category.find({ name: regex })
        .select('name slug level parent')
        .populate('parent', 'name')
        .limit(itemsPerType)
        .lean(),

      Instructor.find({
        $or: [
          { firstName: regex },
          { lastName: regex }
        ]
      })
        .select('firstName lastName title university')
        .populate('university', 'name')
        .limit(itemsPerType)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        courses: courses.map(c => ({
          type: 'course',
          id: c._id,
          title: c.title,
          courseCode: c.courseCode,
          university: c.university?.name,
          slug: c.slug
        })),
        universities: universities.map(u => ({
          type: 'university',
          id: u._id,
          name: u.name,
          location: u.location?.country,
          city: u.location?.city,
          slug: u.slug
        })),
        categories: categories.map(c => ({
          type: 'category',
          id: c._id,
          name: c.name,
          level: c.level,
          parent: c.parent?.name,
          slug: c.slug
        })),
        instructors: instructors.map(i => ({
          type: 'instructor',
          id: i._id,
          name: `${i.firstName} ${i.lastName}`,
          title: i.title,
          university: i.university?.name
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching combined suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions',
      error: error.message
    });
  }
});

module.exports = router;
