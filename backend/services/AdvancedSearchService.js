const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

class AdvancedSearchService {
  /**
   * Perform natural language search with AI-powered matching
   */
  async nlpSearch(query, userId = null) {
    try {
      // Extract keywords from natural language query
      const keywords = this.extractKeywords(query);
      
      // Build search query
      const searchQuery = {
        $or: [
          { title: { $regex: keywords.join('|'), $options: 'i' } },
          { description: { $regex: keywords.join('|'), $options: 'i' } },
          { category: { $regex: keywords.join('|'), $options: 'i' } },
          { 'skills': { $in: keywords } }
        ]
      };

      // Get courses matching the search
      let courses = await Course.find(searchQuery)
        .populate('university')
        .populate('instructors.instructor')
        .limit(50);

      // If user is logged in, personalize results
      if (userId) {
        courses = await this.personalizeResults(courses, userId);
      }

      // Rank results by relevance
      courses = this.rankByRelevance(courses, keywords);

      return courses;
    } catch (error) {
      console.error('NLP Search error:', error);
      throw error;
    }
  }

  /**
   * Extract keywords from natural language query
   */
  extractKeywords(query) {
    // Remove common words
    const stopWords = ['i', 'want', 'to', 'learn', 'about', 'the', 'a', 'an', 'in', 'on', 'for', 'with', 'how', 'course', 'courses'];
    
    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    // Extract potential skill/topic words
    return [...new Set(words)];
  }

  /**
   * Personalize search results based on user history
   */
  async personalizeResults(courses, userId) {
    try {
      // Get user's enrollment history
      const enrollments = await Enrollment.find({ student: userId })
        .populate('course');

      if (enrollments.length === 0) return courses;

      // Get categories user is interested in
      const userCategories = enrollments.map(e => e.course?.category).filter(Boolean);
      const categoryMap = {};
      userCategories.forEach(cat => {
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });

      // Boost courses in user's preferred categories
      courses.forEach(course => {
        if (categoryMap[course.category]) {
          course._personalScore = categoryMap[course.category];
        } else {
          course._personalScore = 0;
        }
      });

      return courses;
    } catch (error) {
      console.error('Personalization error:', error);
      return courses;
    }
  }

  /**
   * Rank courses by relevance to search query
   */
  rankByRelevance(courses, keywords) {
    courses.forEach(course => {
      let score = course._personalScore || 0;
      
      // Check title matches
      keywords.forEach(keyword => {
        if (course.title?.toLowerCase().includes(keyword)) {
          score += 10;
        }
        if (course.description?.toLowerCase().includes(keyword)) {
          score += 5;
        }
        if (course.category?.toLowerCase().includes(keyword)) {
          score += 3;
        }
      });

      // Boost by rating
      if (course.averageRating) {
        score += course.averageRating;
      }

      // Boost by enrollment count
      if (course.enrollment?.currentEnrollment) {
        score += Math.min(course.enrollment.currentEnrollment / 100, 5);
      }

      course._relevanceScore = score;
    });

    // Sort by relevance score
    return courses.sort((a, b) => b._relevanceScore - a._relevanceScore);
  }

  /**
   * AI-powered course matching based on user profile
   */
  async aiCourseMatch(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return [];

      // Get user's completed courses
      const completedEnrollments = await Enrollment.find({
        student: userId,
        status: 'completed'
      }).populate('course');

      // Get user's interests and skills
      const userSkills = user.skills || [];
      const userInterests = user.interests || [];

      // Build a profile of what user likes
      const completedCategories = completedEnrollments.map(e => e.course?.category).filter(Boolean);
      const preferredDifficulty = this.calculatePreferredDifficulty(completedEnrollments);

      // Find matching courses
      const matchingCourses = await Course.find({
        $or: [
          { category: { $in: completedCategories } },
          { skills: { $in: [...userSkills, ...userInterests] } },
          { difficulty: preferredDifficulty }
        ],
        _id: { $nin: completedEnrollments.map(e => e.course._id) }
      })
        .populate('university')
        .limit(20);

      // Calculate match scores
      const scoredCourses = matchingCourses.map(course => {
        let matchScore = 0;

        // Category match
        if (completedCategories.includes(course.category)) {
          matchScore += 30;
        }

        // Skills match
        const skillMatches = course.skills?.filter(skill => 
          userSkills.includes(skill) || userInterests.includes(skill)
        ).length || 0;
        matchScore += skillMatches * 10;

        // Difficulty match
        if (course.difficulty === preferredDifficulty) {
          matchScore += 15;
        }

        // Rating boost
        if (course.averageRating) {
          matchScore += course.averageRating * 2;
        }

        return {
          ...course.toObject(),
          matchScore
        };
      });

      // Sort by match score
      return scoredCourses.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('AI Course Match error:', error);
      throw error;
    }
  }

  /**
   * Calculate user's preferred difficulty level
   */
  calculatePreferredDifficulty(enrollments) {
    const difficultyMap = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3
    };

    if (enrollments.length === 0) return 'beginner';

    const avgDifficulty = enrollments.reduce((sum, e) => {
      return sum + (difficultyMap[e.course?.difficulty] || 1);
    }, 0) / enrollments.length;

    if (avgDifficulty < 1.5) return 'beginner';
    if (avgDifficulty < 2.5) return 'intermediate';
    return 'advanced';
  }

  /**
   * Semantic search using vector similarity (simplified)
   */
  async semanticSearch(query) {
    try {
      // In a real implementation, this would use embeddings and vector similarity
      // For now, we'll use an enhanced keyword search
      
      const keywords = this.extractKeywords(query);
      const synonyms = this.getSynonyms(keywords);
      const allSearchTerms = [...keywords, ...synonyms];

      const courses = await Course.find({
        $or: [
          { title: { $regex: allSearchTerms.join('|'), $options: 'i' } },
          { description: { $regex: allSearchTerms.join('|'), $options: 'i' } },
          { category: { $regex: allSearchTerms.join('|'), $options: 'i' } }
        ]
      })
        .populate('university')
        .limit(30);

      return this.rankByRelevance(courses, allSearchTerms);
    } catch (error) {
      console.error('Semantic search error:', error);
      throw error;
    }
  }

  /**
   * Get synonyms for better search matching
   */
  getSynonyms(keywords) {
    const synonymMap = {
      'programming': ['coding', 'development', 'software'],
      'design': ['ui', 'ux', 'graphic', 'web design'],
      'business': ['management', 'entrepreneurship', 'marketing'],
      'data': ['analytics', 'statistics', 'data science'],
      'ai': ['artificial intelligence', 'machine learning', 'ml'],
      'python': ['programming', 'coding'],
      'javascript': ['js', 'web development', 'frontend'],
      'art': ['drawing', 'painting', 'creative']
    };

    const synonyms = [];
    keywords.forEach(keyword => {
      if (synonymMap[keyword]) {
        synonyms.push(...synonymMap[keyword]);
      }
    });

    return [...new Set(synonyms)];
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(query, limit = 10) {
    try {
      if (!query || query.length < 2) return [];

      // Search in course titles and categories
      const courses = await Course.find({
        $or: [
          { title: { $regex: `^${query}`, $options: 'i' } },
          { category: { $regex: `^${query}`, $options: 'i' } }
        ]
      })
        .select('title category')
        .limit(limit);

      // Extract unique suggestions
      const suggestions = new Set();
      courses.forEach(course => {
        if (course.title.toLowerCase().startsWith(query.toLowerCase())) {
          suggestions.add(course.title);
        }
        if (course.category?.toLowerCase().startsWith(query.toLowerCase())) {
          suggestions.add(course.category);
        }
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }
}

module.exports = new AdvancedSearchService();
