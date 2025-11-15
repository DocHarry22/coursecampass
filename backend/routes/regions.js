const express = require('express');
const router = express.Router();
const Region = require('../models/Region');
const University = require('../models/University');

// @route   GET /api/regions
// @desc    Get all regions (optionally filtered by parent/type)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      parent,
      regionType,
      countryCode,
      search
    } = req.query;

    // Build filter
    const filter = {};
    
    // Filter by parent (null for top-level/continents)
    if (parent !== undefined) {
      filter.parent = parent === 'null' || parent === '' ? null : parent;
    }
    
    if (regionType) {
      filter.regionType = regionType;
    }

    if (countryCode) {
      filter.countryCode = countryCode.toUpperCase();
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const regions = await Region.find(filter)
      .populate('parent', 'name slug regionType')
      .sort({ regionType: 1, name: 1 })
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // Get university counts for each region
    const regionsWithCounts = await Promise.all(
      regions.map(async (region) => {
        const universityCount = await University.countDocuments({
          'location.region': region._id
        });
        return { ...region, universityCount };
      })
    );

    // Get total count
    const total = await Region.countDocuments(filter);

    res.json({
      success: true,
      data: regionsWithCounts,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching regions',
      error: error.message
    });
  }
});

// @route   GET /api/regions/tree
// @desc    Get hierarchical region tree (continent -> country -> state -> city)
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    const { maxLevel = 4 } = req.query;

    // Get all regions
    const allRegions = await Region.find({})
      .sort({ regionType: 1, name: 1 })
      .lean();

    // Build tree structure
    const regionTypeOrder = { continent: 0, country: 1, state: 2, city: 3 };
    
    const buildTree = (parentId = null, currentDepth = 0) => {
      if (currentDepth > Number(maxLevel)) return [];
      
      return allRegions
        .filter(reg => {
          if (parentId === null) {
            return reg.parent === null || reg.parent === undefined;
          }
          return reg.parent && reg.parent.toString() === parentId.toString();
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(reg => ({
          ...reg,
          children: buildTree(reg._id, currentDepth + 1)
        }));
    };

    const tree = buildTree();

    // Add university counts
    const treeWithCounts = await addUniversityCounts(tree);

    res.json({
      success: true,
      data: treeWithCounts
    });
  } catch (error) {
    console.error('Error fetching region tree:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching region tree',
      error: error.message
    });
  }
});

// Helper function to add university counts recursively
async function addUniversityCounts(regions) {
  return Promise.all(
    regions.map(async (region) => {
      const universityCount = await University.countDocuments({
        'location.region': region._id
      });

      const children = region.children && region.children.length > 0
        ? await addUniversityCounts(region.children)
        : [];

      // Sum up counts from children
      const totalCount = universityCount + children.reduce((sum, child) => sum + (child.totalUniversityCount || 0), 0);

      return {
        ...region,
        universityCount,
        totalUniversityCount: totalCount,
        children
      };
    })
  );
}

// @route   GET /api/regions/continents
// @desc    Get all continents
// @access  Public
router.get('/continents', async (req, res) => {
  try {
    const continents = await Region.find({ regionType: 'continent' })
      .sort({ name: 1 })
      .lean();

    const continentsWithCounts = await Promise.all(
      continents.map(async (continent) => {
        // Count countries in this continent
        const countryCount = await Region.countDocuments({
          parent: continent._id,
          regionType: 'country'
        });

        // Count universities in this continent (recursively)
        const countries = await Region.find({ parent: continent._id });
        let universityCount = 0;
        for (const country of countries) {
          const count = await University.countDocuments({
            'location.region': country._id
          });
          universityCount += count;
        }

        return {
          ...continent,
          countryCount,
          universityCount
        };
      })
    );

    res.json({
      success: true,
      data: continentsWithCounts
    });
  } catch (error) {
    console.error('Error fetching continents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching continents',
      error: error.message
    });
  }
});

// @route   GET /api/regions/countries
// @desc    Get all countries (optionally filtered by continent)
// @access  Public
router.get('/countries', async (req, res) => {
  try {
    const { continent } = req.query;

    const filter = { regionType: 'country' };
    
    if (continent) {
      // Find continent by ID or slug
      const continentQuery = continent.match(/^[0-9a-fA-F]{24}$/)
        ? { _id: continent }
        : { slug: continent };
      
      const continentDoc = await Region.findOne(continentQuery);
      if (continentDoc) {
        filter.parent = continentDoc._id;
      }
    }

    const countries = await Region.find(filter)
      .populate('parent', 'name slug')
      .sort({ name: 1 })
      .lean();

    const countriesWithCounts = await Promise.all(
      countries.map(async (country) => {
        const universityCount = await University.countDocuments({
          'location.region': country._id
        });
        return { ...country, universityCount };
      })
    );

    res.json({
      success: true,
      data: countriesWithCounts
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching countries',
      error: error.message
    });
  }
});

// @route   GET /api/regions/:id
// @desc    Get single region by ID or slug
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find by ID or slug
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { slug: id };

    const region = await Region.findOne(query)
      .populate('parent', 'name slug regionType')
      .lean();

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // Get child regions
    const children = await Region.find({ parent: region._id })
      .sort({ regionType: 1, name: 1 })
      .lean();

    // Get university count
    const universityCount = await University.countDocuments({
      'location.region': region._id
    });

    // Get breadcrumb path
    const breadcrumb = await buildBreadcrumb(region);

    res.json({
      success: true,
      data: {
        ...region,
        children,
        universityCount,
        breadcrumb
      }
    });
  } catch (error) {
    console.error('Error fetching region:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching region',
      error: error.message
    });
  }
});

// Helper function to build breadcrumb trail
async function buildBreadcrumb(region) {
  const breadcrumb = [{ _id: region._id, name: region.name, slug: region.slug, regionType: region.regionType }];
  
  let current = region;
  while (current.parent) {
    const parent = await Region.findById(current.parent).lean();
    if (!parent) break;
    breadcrumb.unshift({ _id: parent._id, name: parent.name, slug: parent.slug, regionType: parent.regionType });
    current = parent;
  }
  
  return breadcrumb;
}

// @route   GET /api/regions/:id/universities
// @desc    Get all universities in a region
// @access  Public
router.get('/:id/universities', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      sort = 'name'
    } = req.query;

    // Find region
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { slug: id };
    
    const region = await Region.findOne(query);

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // Build filter
    const filter = {
      'location.region': region._id
    };

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch universities
    const universities = await University.find(filter)
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .lean();

    // Get total count
    const total = await University.countDocuments(filter);

    res.json({
      success: true,
      data: {
        region,
        universities
      },
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching region universities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching region universities',
      error: error.message
    });
  }
});

// @route   POST /api/regions
// @desc    Create a new region
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    const region = new Region(req.body);
    await region.save();

    res.status(201).json({
      success: true,
      data: region,
      message: 'Region created successfully'
    });
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating region',
      error: error.message
    });
  }
});

// @route   PUT /api/regions/:id
// @desc    Update a region
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const region = await Region.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    res.json({
      success: true,
      data: region,
      message: 'Region updated successfully'
    });
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating region',
      error: error.message
    });
  }
});

// @route   DELETE /api/regions/:id
// @desc    Delete a region
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if region has child regions
    const children = await Region.find({ parent: id });
    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete region with sub-regions. Delete sub-regions first.'
      });
    }

    // Check if region has universities
    const universityCount = await University.countDocuments({
      'location.region': id
    });
    if (universityCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete region with ${universityCount} universities. Reassign universities first.`
      });
    }

    const region = await Region.findByIdAndDelete(id);

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    res.json({
      success: true,
      message: 'Region deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting region:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting region',
      error: error.message
    });
  }
});

module.exports = router;
