const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  certificateNumber: {
    type: String,
    unique: true,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'Pass', 'Distinction', 'Merit'],
    default: 'Pass'
  },
  verificationCode: {
    type: String,
    unique: true,
    required: true
  },
  pdfUrl: {
    type: String
  },
  linkedInUrl: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  metadata: {
    courseDuration: String,
    courseCredits: Number,
    instructorName: String,
    universityName: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
CertificateSchema.index({ student: 1, course: 1 });
CertificateSchema.index({ certificateNumber: 1 });
CertificateSchema.index({ verificationCode: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
