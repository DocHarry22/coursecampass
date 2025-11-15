const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: 150
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  iconName: {
    type: String,
    maxlength: 50
  },
  
  // Stats
  courseCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ name: 'text', description: 'text' });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for courses
categorySchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'category'
});

// Generate slug from name
categorySchema.pre('validate', function(next) {
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

module.exports = mongoose.model('Category', categorySchema);
