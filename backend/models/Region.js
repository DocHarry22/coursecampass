const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Region name is required'],
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  regionType: {
    type: String,
    required: true,
    enum: ['continent', 'country', 'state', 'city'],
    default: 'country'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    default: null
  },
  countryCode: {
    type: String,
    uppercase: true,
    maxlength: 5
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
regionSchema.index({ slug: 1, regionType: 1 });
regionSchema.index({ parent: 1 });
regionSchema.index({ countryCode: 1 });
regionSchema.index({ name: 'text' });

// Virtual for child regions
regionSchema.virtual('children', {
  ref: 'Region',
  localField: '_id',
  foreignField: 'parent'
});

// Generate slug
regionSchema.pre('validate', function(next) {
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

module.exports = mongoose.model('Region', regionSchema);
