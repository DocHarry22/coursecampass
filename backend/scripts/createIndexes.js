/**
 * Database Index Creation Script
 * Run this script to create all necessary indexes for optimal performance
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const CourseReview = require('../models/CourseReview');
const Payment = require('../models/Payment');
const Certificate = require('../models/Certificate');

async function createIndexes() {
  try {
    console.log('Creating database indexes...');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ lastLogin: -1 });
    await User.collection.createIndex({ role: 1 });
    console.log('✓ User indexes created');

    // Course indexes
    await Course.collection.createIndex({ title: 'text', description: 'text' });
    await Course.collection.createIndex({ category: 1 });
    await Course.collection.createIndex({ difficulty: 1 });
    await Course.collection.createIndex({ averageRating: -1 });
    await Course.collection.createIndex({ createdAt: -1 });
    await Course.collection.createIndex({ university: 1 });
    await Course.collection.createIndex({ status: 1 });
    await Course.collection.createIndex({ 'instructors.instructor': 1 });
    console.log('✓ Course indexes created');

    // Enrollment indexes
    await Enrollment.collection.createIndex({ student: 1 });
    await Enrollment.collection.createIndex({ course: 1 });
    await Enrollment.collection.createIndex({ status: 1 });
    await Enrollment.collection.createIndex({ enrollmentDate: -1 });
    await Enrollment.collection.createIndex({ student: 1, course: 1 }, { unique: true });
    console.log('✓ Enrollment indexes created');

    // Review indexes
    await CourseReview.collection.createIndex({ course: 1 });
    await CourseReview.collection.createIndex({ user: 1 });
    await CourseReview.collection.createIndex({ status: 1 });
    await CourseReview.collection.createIndex({ createdAt: -1 });
    console.log('✓ Review indexes created');

    // Payment indexes
    await Payment.collection.createIndex({ user: 1 });
    await Payment.collection.createIndex({ course: 1 });
    await Payment.collection.createIndex({ status: 1 });
    await Payment.collection.createIndex({ transactionId: 1 }, { unique: true, sparse: true });
    await Payment.collection.createIndex({ createdAt: -1 });
    console.log('✓ Payment indexes created');

    // Certificate indexes
    await Certificate.collection.createIndex({ student: 1 });
    await Certificate.collection.createIndex({ course: 1 });
    await Certificate.collection.createIndex({ certificateNumber: 1 }, { unique: true });
    await Certificate.collection.createIndex({ verificationCode: 1 }, { unique: true });
    console.log('✓ Certificate indexes created');

    console.log('\n✅ All indexes created successfully!');
    
    // Display index statistics
    const collections = [User, Course, Enrollment, CourseReview, Payment, Certificate];
    for (const Model of collections) {
      const indexes = await Model.collection.getIndexes();
      console.log(`\n${Model.collection.name} indexes:`, Object.keys(indexes).join(', '));
    }

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/coursecompass';
  
  mongoose.connect(dbUrl)
    .then(() => {
      console.log('Connected to MongoDB');
      return createIndexes();
    })
    .then(() => {
      console.log('\nClosing database connection...');
      return mongoose.connection.close();
    })
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database connection error:', error);
      process.exit(1);
    });
}

module.exports = createIndexes;
