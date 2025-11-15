const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  bio: String,
  profileImageUrl: {
    type: String,
    maxlength: 500
  },
  title: {
    type: String,
    maxlength: 100
  },
  department: {
    type: String,
    maxlength: 150
  },
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University'
  },
  
  // Professional Links
  professionalLinks: {
    linkedin: String,
    researchGate: String,
    website: String
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
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
instructorSchema.index({ university: 1 });
instructorSchema.index({ lastName: 1, firstName: 1 });
instructorSchema.index({ email: 1 });

// Virtual for full name
instructorSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for courses
instructorSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'instructors.instructor'
});

module.exports = mongoose.model('Instructor', instructorSchema);
