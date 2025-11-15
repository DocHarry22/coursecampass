const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'University name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  logoUrl: {
    type: String,
    maxlength: 500
  },
  description: {
    type: String
  },
  websiteUrl: {
    type: String,
    maxlength: 500
  },
  
  // Location
  location: {
    country: String,
    stateProvince: String,
    city: String,
    address: String,
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region'
    }
  },
  
  // Institution Details
  institutionType: {
    type: String,
    enum: ['public', 'private', 'online-only', 'hybrid'],
    default: 'public'
  },
  accreditation: [{
    type: String
  }],
  rankings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Contact
  contact: {
    email: String,
    phone: String
  },
  
  // Partner Details
  isPartner: {
    type: Boolean,
    default: false
  },
  partnerTier: {
    type: String,
    enum: ['free', 'premium', 'featured'],
    default: 'free'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  apiEndpoint: {
    type: String,
    maxlength: 500
  },
  
  // Stats
  stats: {
    totalCourses: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalEnrollments: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
universitySchema.index({ slug: 1 });
universitySchema.index({ 'location.country': 1 });
universitySchema.index({ isPartner: 1, partnerTier: 1 });
universitySchema.index({ isVerified: 1 });
universitySchema.index({ name: 'text', description: 'text' });

// Virtual for courses
universitySchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'university'
});

// Method to generate slug from name
universitySchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  next();
});

module.exports = mongoose.model('University', universitySchema);
