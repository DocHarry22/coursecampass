const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  
  // Profile
  avatar: String,
  bio: {
    type: String,
    maxlength: 500
  },
  phone: String,
  dateOfBirth: Date,
  country: String,
  city: String,
  
  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    courseRecommendations: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  
  // Learning Profile
  learningProfile: {
    interests: [String],
    goals: [String],
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    preferredLearningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
      default: 'visual'
    }
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin', 'moderator'],
    default: 'student'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  
  // Social Auth
  googleId: String,
  facebookId: String,
  linkedinId: String,
  
  // Activity Tracking
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Statistics
  stats: {
    coursesEnrolled: {
      type: Number,
      default: 0
    },
    coursesCompleted: {
      type: Number,
      default: 0
    },
    certificatesEarned: {
      type: Number,
      default: 0
    },
    reviewsWritten: {
      type: Number,
      default: 0
    },
    totalLearningHours: {
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
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, isBanned: 1 });
userSchema.index({ 'learningProfile.interests': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for enrolled courses
userSchema.virtual('enrolledCourses', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'user'
});

// Virtual for favorites
userSchema.virtual('favorites', {
  ref: 'Favorite',
  localField: '_id',
  foreignField: 'user'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
