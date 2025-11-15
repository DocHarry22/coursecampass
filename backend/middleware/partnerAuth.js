const PartnerApiKey = require('../models/PartnerApiKey');

/**
 * Middleware to authenticate partner API requests
 */
async function authenticatePartner(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        success: false,
        message: 'Missing API credentials. Include X-API-Key and X-API-Secret headers.'
      });
    }

    // Find partner by API key
    const partner = await PartnerApiKey.findOne({ apiKey }).populate('university');

    if (!partner) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Check if key is active
    if (!partner.isActive) {
      return res.status(403).json({
        success: false,
        message: 'API key has been deactivated'
      });
    }

    // Check expiration
    if (partner.expiresAt && partner.expiresAt < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'API key has expired'
      });
    }

    // Validate secret
    if (!partner.validateSecret(apiSecret)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API secret'
      });
    }

    // Check rate limit
    if (!partner.checkRateLimit()) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Try again tomorrow.',
        rateLimit: partner.rateLimit
      });
    }

    // Record usage
    await partner.recordUsage();

    // Attach partner info to request
    req.partner = {
      id: partner._id,
      university: partner.university,
      permissions: partner.permissions
    };

    next();
  } catch (error) {
    console.error('Partner authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
}

/**
 * Middleware to check specific permission
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.partner) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!req.partner.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Missing required permission: ${permission}`
      });
    }

    next();
  };
}

module.exports = {
  authenticatePartner,
  requirePermission
};
