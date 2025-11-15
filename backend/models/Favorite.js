const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  collection: {
    type: String,
    default: 'default' // For organizing favorites into collections
  },
  notes: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
favoriteSchema.index({ user: 1, course: 1 }, { unique: true });
favoriteSchema.index({ user: 1, collection: 1 });
favoriteSchema.index({ addedAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
