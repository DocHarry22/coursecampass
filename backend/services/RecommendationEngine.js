const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Favorite = require('../models/Favorite');
const CourseReview = require('../models/CourseReview');
const User = require('../models/User');

class RecommendationEngine {
  /**
   * Get personalized course recommendations for a user
   */
  static async getRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Get user's learning history
      const enrollments = await Enrollment.find({ user: userId }).populate('course');
      const favorites = await Favorite.find({ user: userId }).populate('course');
      const reviews = await CourseReview.find({ user: userId }).populate('course');

      // Extract categories and interests
      const enrolledCategories = new Set();
      const enrolledUniversities = new Set();
      const preferredLevels = new Set();

      enrollments.forEach(e => {
        if (e.course?.categories) {
          e.course.categories.forEach(cat => enrolledCategories.add(cat.toString()));
        }
        if (e.course?.university) {
          enrolledUniversities.add(e.course.university.toString());
        }
        if (e.course?.level) {
          preferredLevels.add(e.course.level);
        }
      });

      // Get user's interests from profile
      const userInterests = user.learningProfile?.interests || [];

      // Build recommendation query
      const recommendations = [];

      // 1. Content-based recommendations (similar to enrolled/favorited courses)
      if (enrolledCategories.size > 0) {
        const contentBased = await Course.find({
          categories: { $in: Array.from(enrolledCategories) },
          _id: { $nin: enrollments.map(e => e.course?._id).filter(Boolean) },
          isActive: true
        })
          .limit(limit / 2)
          .populate('university')
          .populate('categories');
        
        recommendations.push(...contentBased.map(course => ({
          course,
          score: 0.8,
          reason: 'Based on your enrolled courses'
        })));
      }

      // 2. Collaborative filtering (what similar users like)
      const similarUsers = await this.findSimilarUsers(userId, enrolledCategories);
      if (similarUsers.length > 0) {
        const collaborativeRecs = await this.getCollaborativeRecommendations(
          userId,
          similarUsers,
          limit / 4
        );
        recommendations.push(...collaborativeRecs);
      }

      // 3. Popular courses in user's preferred categories
      if (enrolledCategories.size > 0) {
        const trending = await Course.aggregate([
          {
            $match: {
              categories: { $in: Array.from(enrolledCategories) },
              isActive: true
            }
          },
          {
            $lookup: {
              from: 'enrollments',
              localField: '_id',
              foreignField: 'course',
              as: 'enrollments'
            }
          },
          {
            $addFields: {
              enrollmentCount: { $size: '$enrollments' }
            }
          },
          {
            $sort: { enrollmentCount: -1, rating: -1 }
          },
          {
            $limit: limit / 4
          }
        ]);

        const populatedTrending = await Course.populate(trending, [
          { path: 'university' },
          { path: 'categories' }
        ]);

        recommendations.push(...populatedTrending.map(course => ({
          course,
          score: 0.6,
          reason: 'Popular in your field of interest'
        })));
      }

      // 4. Based on learning profile interests
      if (userInterests.length > 0) {
        const interestBased = await Course.find({
          $or: [
            { title: { $regex: userInterests.join('|'), $options: 'i' } },
            { description: { $regex: userInterests.join('|'), $options: 'i' } }
          ],
          _id: { $nin: enrollments.map(e => e.course?._id).filter(Boolean) },
          isActive: true
        })
          .limit(limit / 4)
          .populate('university')
          .populate('categories');
        
        recommendations.push(...interestBased.map(course => ({
          course,
          score: 0.7,
          reason: 'Matches your interests'
        })));
      }

      // Remove duplicates and already enrolled courses
      const uniqueRecs = this.removeDuplicates(
        recommendations,
        enrollments.map(e => e.course?._id?.toString()).filter(Boolean)
      );

      // Sort by score and limit
      return uniqueRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Recommendation engine error:', error);
      return [];
    }
  }

  /**
   * Find users with similar learning patterns
   */
  static async findSimilarUsers(userId, userCategories, limit = 10) {
    try {
      const similarUsers = await Enrollment.aggregate([
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'courseData'
          }
        },
        {
          $unwind: '$courseData'
        },
        {
          $match: {
            user: { $ne: userId },
            'courseData.categories': { $in: Array.from(userCategories) }
          }
        },
        {
          $group: {
            _id: '$user',
            commonCourses: { $sum: 1 }
          }
        },
        {
          $sort: { commonCourses: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return similarUsers.map(u => u._id);
    } catch (error) {
      console.error('Find similar users error:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on what similar users enrolled in
   */
  static async getCollaborativeRecommendations(userId, similarUserIds, limit = 5) {
    try {
      const userEnrollments = await Enrollment.find({ user: userId }).select('course');
      const enrolledCourseIds = userEnrollments.map(e => e.course.toString());

      const recommendations = await Enrollment.aggregate([
        {
          $match: {
            user: { $in: similarUserIds },
            course: { $nin: enrolledCourseIds }
          }
        },
        {
          $group: {
            _id: '$course',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'courseData'
          }
        },
        {
          $unwind: '$courseData'
        }
      ]);

      const populatedRecs = await Course.populate(recommendations.map(r => r.courseData), [
        { path: 'university' },
        { path: 'categories' }
      ]);

      return populatedRecs.map(course => ({
        course,
        score: 0.75,
        reason: 'Students like you also enrolled in this'
      }));
    } catch (error) {
      console.error('Collaborative recommendations error:', error);
      return [];
    }
  }

  /**
   * Get trending courses
   */
  static async getTrendingCourses(limit = 10) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trending = await Enrollment.aggregate([
        {
          $match: {
            enrollmentDate: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$course',
            recentEnrollments: { $sum: 1 }
          }
        },
        {
          $sort: { recentEnrollments: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'courseData'
          }
        },
        {
          $unwind: '$courseData'
        }
      ]);

      return await Course.populate(trending.map(t => t.courseData), [
        { path: 'university' },
        { path: 'categories' }
      ]);
    } catch (error) {
      console.error('Get trending courses error:', error);
      return [];
    }
  }

  /**
   * Get courses recommended for beginners
   */
  static async getBeginnerCourses(limit = 10) {
    try {
      return await Course.find({
        level: 'Beginner',
        isActive: true,
        rating: { $gte: 4.0 }
      })
        .sort({ enrollmentCount: -1, rating: -1 })
        .limit(limit)
        .populate('university')
        .populate('categories');
    } catch (error) {
      console.error('Get beginner courses error:', error);
      return [];
    }
  }

  /**
   * Remove duplicate recommendations
   */
  static removeDuplicates(recommendations, excludeIds = []) {
    const seen = new Set(excludeIds);
    return recommendations.filter(rec => {
      const courseId = rec.course._id.toString();
      if (seen.has(courseId)) {
        return false;
      }
      seen.add(courseId);
      return true;
    });
  }
}

module.exports = RecommendationEngine;
