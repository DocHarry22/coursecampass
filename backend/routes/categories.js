const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Course = require('../models/Course');

// @route   GET /api/categories
// @desc    Get all categories (optionally filtered by parent)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      parent,
      level,
      search
    } = req.query;

    // Build filter
    const filter = {};
    
    // Filter by parent (null for top-level categories)
    if (parent !== undefined) {
      filter.parent = parent === 'null' || parent === '' ? null : parent;
    }
    
    if (level !== undefined) {
      filter.level = Number(level);
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const categories = await Category.find(filter)
      .populate('parent', 'name slug')
      .sort({ level: 1, name: 1 })
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // Get course counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const courseCount = await Course.countDocuments({
          category: category._id,
          isActive: true,
          verificationStatus: 'approved'
        });
        return { ...category, courseCount };
      })
    );

    // Get total count
    const total = await Category.countDocuments(filter);

    res.json({
      success: true,
      data: categoriesWithCounts,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// @route   GET /api/categories/tree
// @desc    Get hierarchical category tree
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    const { maxLevel = 3 } = req.query;

    // Get all categories
    const allCategories = await Category.find({})
      .sort({ level: 1, name: 1 })
      .lean();

    // Build tree structure
    const buildTree = (parentId = null, currentLevel = 0) => {
      if (currentLevel > Number(maxLevel)) return [];
      
      return allCategories
        .filter(cat => {
          if (parentId === null) {
            return cat.parent === null || cat.parent === undefined;
          }
          return cat.parent && cat.parent.toString() === parentId.toString();
        })
        .map(cat => ({
          ...cat,
          children: buildTree(cat._id, currentLevel + 1)
        }));
    };

    const tree = buildTree();

    // Get course counts
    const treeWithCounts = await addCourseCounts(tree);

    res.json({
      success: true,
      data: treeWithCounts
    });
  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category tree',
      error: error.message
    });
  }
});

// Helper function to add course counts recursively
async function addCourseCounts(categories) {
  return Promise.all(
    categories.map(async (category) => {
      const courseCount = await Course.countDocuments({
        category: category._id,
        isActive: true,
        verificationStatus: 'approved'
      });

      const children = category.children && category.children.length > 0
        ? await addCourseCounts(category.children)
        : [];

      return {
        ...category,
        courseCount,
        children
      };
    })
  );
}

// @route   GET /api/categories/:id
// @desc    Get single category by ID or slug
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find by ID or slug
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { slug: id };

    const category = await Category.findOne(query)
      .populate('parent', 'name slug level')
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get subcategories
    const subcategories = await Category.find({ parent: category._id })
      .sort({ name: 1 })
      .lean();

    // Get course count
    const courseCount = await Course.countDocuments({
      category: category._id,
      isActive: true,
      verificationStatus: 'approved'
    });

    // Get breadcrumb path
    const breadcrumb = await buildBreadcrumb(category);

    res.json({
      success: true,
      data: {
        ...category,
        subcategories,
        courseCount,
        breadcrumb
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// Helper function to build breadcrumb trail
async function buildBreadcrumb(category) {
  const breadcrumb = [{ _id: category._id, name: category.name, slug: category.slug }];
  
  let current = category;
  while (current.parent) {
    const parent = await Category.findById(current.parent).lean();
    if (!parent) break;
    breadcrumb.unshift({ _id: parent._id, name: parent.name, slug: parent.slug });
    current = parent;
  }
  
  return breadcrumb;
}

// @route   GET /api/categories/:id/courses
// @desc    Get all courses in a category (including subcategories)
// @access  Public
router.get('/:id/courses', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      includeSubcategories = 'true'
    } = req.query;

    // Find category
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { slug: id };
    
    const category = await Category.findOne(query);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build course filter
    let categoryIds = [category._id];

    // Include subcategories if requested
    if (includeSubcategories === 'true') {
      const subcategories = await getAllSubcategories(category._id);
      categoryIds = [...categoryIds, ...subcategories.map(sc => sc._id)];
    }

    const filter = {
      category: { $in: categoryIds },
      isActive: true,
      verificationStatus: 'approved'
    };

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch courses
    const courses = await Course.find(filter)
      .populate('university', 'name slug logoUrl location.country')
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
        category,
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
    console.error('Error fetching category courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category courses',
      error: error.message
    });
  }
});

// Helper function to get all subcategories recursively
async function getAllSubcategories(parentId) {
  const subcategories = await Category.find({ parent: parentId }).lean();
  let allSubcategories = [...subcategories];
  
  for (const sub of subcategories) {
    const nested = await getAllSubcategories(sub._id);
    allSubcategories = [...allSubcategories, ...nested];
  }
  
  return allSubcategories;
}

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    // If parent is provided, update level automatically
    if (req.body.parent) {
      const parent = await Category.findById(req.body.parent);
      if (parent) {
        req.body.level = parent.level + 1;
      }
    }

    const category = new Category(req.body);
    await category.save();

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // If parent is being changed, update level
    if (req.body.parent) {
      const parent = await Category.findById(req.body.parent);
      if (parent) {
        req.body.level = parent.level + 1;
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has subcategories
    const subcategories = await Category.find({ parent: id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete subcategories first.'
      });
    }

    // Check if category has courses
    const courseCount = await Course.countDocuments({ category: id });
    if (courseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${courseCount} courses. Reassign courses first.`
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
});

module.exports = router;
