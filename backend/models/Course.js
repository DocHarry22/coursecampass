const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: 300
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  fullDescription: String,
  syllabus: String,
  
  // Relationships
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: [true, 'University is required']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  instructors: [{
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instructor'
    },
    role: {
      type: String,
      enum: ['lead', 'instructor', 'teaching-assistant'],
      default: 'instructor'
    }
  }],
  
  // Course Details
  courseCode: {
    type: String,
    maxlength: 50
  },
  level: {
    type: String,
    enum: ['undergraduate', 'graduate', 'professional', 'certificate', 'short-course', 'bootcamp'],
    default: 'undergraduate'
  },
  deliveryMode: {
    type: String,
    required: true,
    enum: ['online', 'in-person', 'hybrid', 'blended'],
    default: 'online'
  },
  language: {
    type: String,
    default: 'English'
  },
  
  // Pricing
  pricing: {
    type: {
      type: String,
      required: true,
      enum: ['free', 'paid', 'freemium', 'subscription'],
      default: 'paid'
    },
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: 10
    },
    originalAmount: Number, // For discounts
    billingCycle: {
      type: String,
      enum: ['one-time', 'monthly', 'yearly', 'per-credit']
    }
  },
  
  // Duration & Schedule
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years', 'hours']
    }
  },
  isSelfPaced: {
    type: Boolean,
    default: false
  },
  schedule: {
    startDate: Date,
    endDate: Date,
    enrollmentDeadline: Date
  },
  
  // Capacity & Enrollment
  enrollment: {
    maxCapacity: Number,
    currentCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['open', 'waitlist', 'closed', 'full'],
      default: 'open'
    }
  },
  
  // Academic Details
  credits: {
    type: Number,
    min: 0
  },
  prerequisites: String,
  learningOutcomes: [String],
  assessmentMethods: [String],
  
  // Certification
  certification: {
    type: {
      type: String,
      enum: ['certificate', 'diploma', 'degree', 'microcredential', 'badge', 'audit', 'none'],
      default: 'certificate'
    },
    isAccredited: {
      type: Boolean,
      default: false
    },
    accreditingBody: String
  },
  
  // Accessibility
  accessibilityFeatures: [{
    type: String,
    enum: ['captions', 'transcripts', 'sign-language', 'screen-reader', 'downloadable-content', 'mobile-friendly']
  }],
  
  // Media
  media: {
    thumbnailUrl: String,
    videoPreviewUrl: String,
    images: [String]
  },
  
  // External Links
  links: {
    courseUrl: {
      type: String,
      required: [true, 'Course URL is required'],
      maxlength: 500
    },
    applicationUrl: String,
    syllabusUrl: String
  },
  
  // Ratings & Stats
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  stats: {
    totalEnrollments: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    favoriteCount: {
      type: Number,
      default: 0
    }
  },
  
  // Status & Moderation
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under-review'],
    default: 'pending'
  },
  
  // Data Source
  dataSource: {
    source: {
      type: String,
      enum: ['scraped', 'api', 'manual', 'partner', 'partner_api', 'partner_api_bulk'],
      default: 'manual'
    },
    sourceUrl: String,
    lastScrapedAt: Date
  },
  
  // Partner API Fields
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PartnerApiKey'
  },
  moderationNotes: String,
  rejectionReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for search and filtering
courseSchema.index({ slug: 1 });
courseSchema.index({ university: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ 'instructors.instructor': 1 });
courseSchema.index({ deliveryMode: 1 });
courseSchema.index({ 'pricing.type': 1 });
courseSchema.index({ 'pricing.amount': 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isActive: 1, verificationStatus: 1 });
courseSchema.index({ 'ratings.average': -1 });
courseSchema.index({ 'schedule.startDate': 1 });
courseSchema.index({ isFeatured: -1 });
courseSchema.index({ language: 1 });
courseSchema.index({ createdAt: -1 });

// Text search index
courseSchema.index({ 
  title: 'text', 
  shortDescription: 'text', 
  fullDescription: 'text',
  courseCode: 'text'
});

// Compound indexes for common queries
courseSchema.index({ university: 1, isActive: 1 });
courseSchema.index({ category: 1, isActive: 1 });
courseSchema.index({ 'pricing.type': 1, isActive: 1 });
courseSchema.index({ deliveryMode: 1, 'pricing.type': 1 });

// Virtual for reviews
courseSchema.virtual('reviews', {
  ref: 'CourseReview',
  localField: '_id',
  foreignField: 'course'
});

// Generate slug from title
courseSchema.pre('validate', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
    
    // Add random suffix to ensure uniqueness
    this.slug += '-' + Math.random().toString(36).substring(7);
  }
  next();
});

// Update enrollment status based on capacity
courseSchema.pre('save', function(next) {
  if (this.enrollment.maxCapacity && this.enrollment.currentCount) {
    if (this.enrollment.currentCount >= this.enrollment.maxCapacity) {
      this.enrollment.status = 'full';
    } else if (this.enrollment.currentCount >= this.enrollment.maxCapacity * 0.9) {
      this.enrollment.status = 'waitlist';
    } else {
      this.enrollment.status = 'open';
    }
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
