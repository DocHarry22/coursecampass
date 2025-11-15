const express = require('express');
const router = express.Router();
const PartnerApiKey = require('../models/PartnerApiKey');
const University = require('../models/University');

// Admin routes for managing partner API keys

// @route   POST /api/admin/partner-keys
// @desc    Generate API key for a university (admin only)
// @access  Admin
router.post('/partner-keys', async (req, res) => {
  try {
    const { universityId, permissions, rateLimit, expiresInDays } = req.body;

    // Check if university exists
    const university = await University.findById(universityId);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    // Check if API key already exists for this university
    const existingKey = await PartnerApiKey.findOne({ university: universityId });
    if (existingKey) {
      return res.status(400).json({
        success: false,
        message: 'API key already exists for this university'
      });
    }

    // Generate credentials
    const { apiKey, apiSecret } = PartnerApiKey.generateCredentials();

    // Create API key record
    const partnerKey = await PartnerApiKey.create({
      university: universityId,
      apiKey,
      apiSecret, // Will be hashed by pre-save hook
      permissions: permissions || ['read', 'create', 'update', 'delete', 'analytics'],
      rateLimit: rateLimit || {
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null
    });

    // IMPORTANT: Return the plain secret only once (it will be hashed in DB)
    res.status(201).json({
      success: true,
      message: 'API key generated successfully. Save the secret - it cannot be retrieved later!',
      data: {
        apiKey,
        apiSecret, // Only shown once
        university: university.name,
        permissions: partnerKey.permissions,
        rateLimit: partnerKey.rateLimit,
        expiresAt: partnerKey.expiresAt
      }
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API key',
      error: error.message
    });
  }
});

// @route   GET /api/admin/partner-keys
// @desc    List all partner API keys
// @access  Admin
router.get('/partner-keys', async (req, res) => {
  try {
    const keys = await PartnerApiKey.find()
      .populate('university', 'name country region')
      .select('-apiSecret') // Never return hashed secret
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: keys
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys',
      error: error.message
    });
  }
});

// @route   PATCH /api/admin/partner-keys/:id
// @desc    Update partner API key settings
// @access  Admin
router.patch('/partner-keys/:id', async (req, res) => {
  try {
    const { isActive, permissions, rateLimit, expiresAt } = req.body;

    const updates = {};
    if (typeof isActive !== 'undefined') updates.isActive = isActive;
    if (permissions) updates.permissions = permissions;
    if (rateLimit) updates.rateLimit = rateLimit;
    if (expiresAt) updates.expiresAt = expiresAt;

    const partnerKey = await PartnerApiKey.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('university', 'name');

    if (!partnerKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: partnerKey
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/partner-keys/:id
// @desc    Revoke partner API key
// @access  Admin
router.delete('/partner-keys/:id', async (req, res) => {
  try {
    const partnerKey = await PartnerApiKey.findByIdAndDelete(req.params.id);

    if (!partnerKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key',
      error: error.message
    });
  }
});

// @route   POST /api/admin/partner-keys/:id/regenerate
// @desc    Regenerate API secret for existing key
// @access  Admin
router.post('/partner-keys/:id/regenerate', async (req, res) => {
  try {
    const partnerKey = await PartnerApiKey.findById(req.params.id).populate('university', 'name');

    if (!partnerKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Generate new secret only (keep same API key)
    const { apiSecret } = PartnerApiKey.generateCredentials();
    partnerKey.apiSecret = apiSecret; // Will be hashed by pre-save hook
    await partnerKey.save();

    res.json({
      success: true,
      message: 'API secret regenerated. Save it - it cannot be retrieved later!',
      data: {
        apiKey: partnerKey.apiKey,
        apiSecret, // Only shown once
        university: partnerKey.university.name
      }
    });
  } catch (error) {
    console.error('Error regenerating secret:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate secret',
      error: error.message
    });
  }
});

module.exports = router;
