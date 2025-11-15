const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  // References
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
  
  // Enrollment Details
  status: {
    type: String,
    enum: ['enrolled', 'in-progress', 'completed', 'dropped', 'paused'],
    default: 'enrolled'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  completionDate: Date,
  
  // Progress Tracking
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedLectures: {
      type: Number,
      default: 0
    },
    totalLectures: {
      type: Number,
      default: 0
    },
    completedAssignments: {
      type: Number,
      default: 0
    },
    totalAssignments: {
      type: Number,
      default: 0
    },
    lastAccessedAt: Date
  },
  
  // Performance Metrics
  performance: {
    averageScore: Number,
    quizScores: [{
      quizId: String,
      score: Number,
      maxScore: Number,
      completedAt: Date
    }],
    assignmentScores: [{
      assignmentId: String,
      score: Number,
      maxScore: Number,
      submittedAt: Date,
      feedback: String
    }]
  },
  
  // Time Tracking
  timeSpent: {
    total: {
      type: Number,
      default: 0 // in minutes
    },
    byWeek: [{
      weekStart: Date,
      minutes: Number
    }]
  },
  
  // Certificate
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedDate: Date,
    certificateId: String,
    certificateUrl: String
  },
  
  // Payment (if applicable)
  payment: {
    amount: Number,
    currency: String,
    paymentDate: Date,
    transactionId: String,
    paymentMethod: String
  },
  
  // Notes & Bookmarks
  notes: [{
    content: String,
    lectureId: String,
    timestamp: Number, // video timestamp if applicable
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    lectureId: String,
    title: String,
    timestamp: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Feedback & Rating
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    reviewDate: Date,
    wouldRecommend: Boolean
  }
}, {
  timestamps: true
});

// Indexes
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true }); // One enrollment per user per course
enrollmentSchema.index({ user: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });
enrollmentSchema.index({ 'progress.percentage': 1 });

// Update progress percentage
enrollmentSchema.methods.updateProgress = function() {
  const lectureProgress = this.progress.totalLectures > 0 
    ? (this.progress.completedLectures / this.progress.totalLectures) * 50 
    : 0;
  
  const assignmentProgress = this.progress.totalAssignments > 0
    ? (this.progress.completedAssignments / this.progress.totalAssignments) * 50
    : 0;
  
  this.progress.percentage = Math.round(lectureProgress + assignmentProgress);
  
  if (this.progress.percentage === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completionDate = new Date();
  }
};

// Calculate average score
enrollmentSchema.methods.calculateAverageScore = function() {
  const allScores = [
    ...this.performance.quizScores.map(q => (q.score / q.maxScore) * 100),
    ...this.performance.assignmentScores.map(a => (a.score / a.maxScore) * 100)
  ];
  
  if (allScores.length === 0) return null;
  
  const sum = allScores.reduce((acc, score) => acc + score, 0);
  this.performance.averageScore = Math.round(sum / allScores.length);
  return this.performance.averageScore;
};

// Add time spent
enrollmentSchema.methods.addTimeSpent = function(minutes) {
  this.progress.lastAccessedAt = new Date();
  this.total += minutes;
  
  // Update weekly tracking
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const currentWeek = this.timeSpent.byWeek.find(w => 
    w.weekStart.getTime() === weekStart.getTime()
  );
  
  if (currentWeek) {
    currentWeek.minutes += minutes;
  } else {
    this.timeSpent.byWeek.push({
      weekStart,
      minutes
    });
  }
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
