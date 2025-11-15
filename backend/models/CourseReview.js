const mongoose = require('mongoose');

const courseReviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Will be required once user authentication is implemented
  },
  
  // Rating & Review
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  reviewTitle: {
    type: String,
    maxlength: 200,
    trim: true
  },
  reviewText: {
    type: String,
    maxlength: 2000
  },
  
  // Detailed ratings (optional)
  detailedRatings: {
    content: {
      type: Number,
      min: 1,
      max: 5
    },
    instructor: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Engagement
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Verification
  isVerifiedEnrollment: {
    type: Boolean,
    default: false
  },
  
  // Moderation
  isApproved: {
    type: Boolean,
    default: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String
}, {
  timestamps: true
});

// Indexes
courseReviewSchema.index({ course: 1 });
courseReviewSchema.index({ user: 1 });
courseReviewSchema.index({ rating: -1 });
courseReviewSchema.index({ createdAt: -1 });
courseReviewSchema.index({ helpfulCount: -1 });
courseReviewSchema.index({ isApproved: 1 });

// Ensure one review per user per course
courseReviewSchema.index({ course: 1, user: 1 }, { unique: true });

// Update course average rating after review changes
courseReviewSchema.post('save', async function() {
  const Course = mongoose.model('Course');
  const stats = await mongoose.model('CourseReview').aggregate([
    { $match: { course: this.course, isApproved: true } },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Course.findByIdAndUpdate(this.course, {
      'ratings.average': Math.round(stats[0].averageRating * 100) / 100,
      'ratings.count': stats[0].count
    });
  }
});

// Update course rating after review deletion
courseReviewSchema.post('remove', async function() {
  const Course = mongoose.model('Course');
  const stats = await mongoose.model('CourseReview').aggregate([
    { $match: { course: this.course, isApproved: true } },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Course.findByIdAndUpdate(this.course, {
      'ratings.average': Math.round(stats[0].averageRating * 100) / 100,
      'ratings.count': stats[0].count
    });
  } else {
    await Course.findByIdAndUpdate(this.course, {
      'ratings.average': 0,
      'ratings.count': 0
    });
  }
});

module.exports = mongoose.model('CourseReview', courseReviewSchema);
