const mongoose = require('mongoose');
const crypto = require('crypto');

const partnerApiKeySchema = new mongoose.Schema({
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true,
    unique: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  apiSecret: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [{
    type: String,
    enum: ['read', 'create', 'update', 'delete', 'analytics']
  }],
  rateLimit: {
    requestsPerHour: {
      type: Number,
      default: 1000
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },
  usage: {
    lastUsed: Date,
    totalRequests: {
      type: Number,
      default: 0
    },
    requestsToday: {
      type: Number,
      default: 0
    },
    resetDate: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate API key and secret
partnerApiKeySchema.statics.generateCredentials = function() {
  const apiKey = 'pk_' + crypto.randomBytes(24).toString('hex');
  const apiSecret = 'sk_' + crypto.randomBytes(32).toString('hex');
  return { apiKey, apiSecret };
};

// Hash API secret before saving
partnerApiKeySchema.pre('save', function(next) {
  if (this.isModified('apiSecret')) {
    const hash = crypto.createHash('sha256');
    hash.update(this.apiSecret);
    this.apiSecret = hash.digest('hex');
  }
  next();
});

// Validate API secret
partnerApiKeySchema.methods.validateSecret = function(secret) {
  const hash = crypto.createHash('sha256');
  hash.update(secret);
  return hash.digest('hex') === this.apiSecret;
};

// Update usage statistics
partnerApiKeySchema.methods.recordUsage = function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!this.usage.resetDate || this.usage.resetDate < today) {
    this.usage.requestsToday = 0;
    this.usage.resetDate = today;
  }
  
  this.usage.lastUsed = now;
  this.usage.totalRequests += 1;
  this.usage.requestsToday += 1;
  
  return this.save();
};

// Check if rate limit exceeded
partnerApiKeySchema.methods.checkRateLimit = function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!this.usage.resetDate || this.usage.resetDate < today) {
    return true; // New day, allow request
  }
  
  return this.usage.requestsToday < this.rateLimit.requestsPerDay;
};

module.exports = mongoose.model('PartnerApiKey', partnerApiKeySchema);
