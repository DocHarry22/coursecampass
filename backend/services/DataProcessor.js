const cheerio = require('cheerio');
const winston = require('winston');
const Course = require('../models/Course');
const University = require('../models/University');
const Category = require('../models/Category');
const Instructor = require('../models/Instructor');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/data-processor-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/data-processor.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class DataProcessor {
  constructor() {
    this.currencyRates = {
      'USD': 1,
      'GBP': 1.27,
      'EUR': 1.09,
      'CAD': 0.74,
      'AUD': 0.66
    };
  }

  /**
   * Process a batch of scraped courses
   */
  async processBatch(scrapedCourses) {
    const processed = [];

    for (const courseData of scrapedCourses) {
      try {
        const processedCourse = await this.processCourse(courseData);
        if (processedCourse) {
          processed.push(processedCourse);
        }
      } catch (error) {
        logger.error(`Failed to process course: ${courseData.title}`, error);
      }
    }

    return processed;
  }

  /**
   * Process a single course
   */
  async processCourse(rawData) {
    try {
      logger.info(`Processing course: ${rawData.title}`);

      // Validate required fields
      const validation = this.validateCourseData(rawData);
      if (!validation.isValid) {
        logger.warn(`Course validation failed: ${rawData.title}`, validation.errors);
        return null;
      }

      // Normalize and clean data
      const normalized = {
        title: this.cleanText(rawData.title),
        courseCode: rawData.courseCode || this.generateCourseCode(rawData),
        description: this.cleanHtml(rawData.description),
        level: this.normalizeLevel(rawData.level),
        language: this.normalizeLanguage(rawData.language),
        deliveryMode: this.normalizeDeliveryMode(rawData.deliveryMode),
        isActive: rawData.isActive !== false,
        verificationStatus: 'pending',
        
        // Source information
        sourceUrl: rawData.sourceUrl,
        lastScrapedAt: rawData.scrapedAt || new Date()
      };

      // Process university
      const university = await this.findOrCreateUniversity(rawData.university, rawData.source);
      normalized.university = university._id;

      // Process pricing
      normalized.pricing = this.normalizePricing(rawData.pricing);

      // Process duration
      if (rawData.duration) {
        normalized.duration = this.normalizeDuration(rawData.duration);
      }

      // Process dates
      if (rawData.startDate) {
        normalized.startDate = this.parseDate(rawData.startDate);
      }
      if (rawData.endDate) {
        normalized.endDate = this.parseDate(rawData.endDate);
      }

      // Process instructors
      if (rawData.instructors && rawData.instructors.length > 0) {
        const instructorIds = await this.processInstructors(rawData.instructors, university._id);
        normalized.instructors = instructorIds;
      }

      // Process categories
      if (rawData.department || rawData.rawData?.category) {
        const category = await this.findOrCreateCategory(rawData.department || rawData.rawData.category);
        if (category) {
          normalized.categories = [category._id];
        }
      }

      // Process syllabus
      if (rawData.syllabus && Array.isArray(rawData.syllabus)) {
        normalized.syllabus = rawData.syllabus
          .map(item => this.cleanText(item))
          .filter(item => item.length > 0);
      }

      // Process prerequisites
      if (rawData.prerequisites) {
        normalized.prerequisites = this.cleanText(rawData.prerequisites);
      }

      // Process certification
      if (rawData.certification) {
        normalized.certification = {
          available: rawData.certification.available || false,
          type: rawData.certification.type || 'none',
          isPaid: rawData.certification.isPaid || false
        };
      }

      // Process accessibility
      if (rawData.accessibility) {
        normalized.accessibility = rawData.accessibility;
      }

      // Process skills/tags
      if (rawData.skills && Array.isArray(rawData.skills)) {
        normalized.tags = rawData.skills.map(s => this.cleanText(s));
      }

      // Process rating
      if (rawData.rating) {
        normalized.averageRating = Math.min(5, Math.max(0, rawData.rating));
      }

      // Create or update course in database
      const savedCourse = await this.saveOrUpdateCourse(normalized, rawData.sourceUrl);

      logger.info(`Successfully processed course: ${normalized.title}`);
      return savedCourse;

    } catch (error) {
      logger.error(`Error processing course: ${rawData.title}`, error);
      throw error;
    }
  }

  /**
   * Validate course data
   */
  validateCourseData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!data.university) {
      errors.push('University is required');
    }

    if (!data.description || data.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean HTML and extract text
   */
  cleanHtml(html) {
    if (!html) return '';
    
    const $ = cheerio.load(html);
    const text = $.text();
    
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  /**
   * Clean text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .trim();
  }

  /**
   * Normalize pricing
   */
  normalizePricing(pricing) {
    if (!pricing) {
      return { type: 'unknown', amount: null, currency: 'USD' };
    }

    const normalized = {
      type: pricing.type || 'unknown',
      currency: pricing.currency || 'USD'
    };

    // Convert to USD if needed
    if (pricing.amount && pricing.currency && pricing.currency !== 'USD') {
      const rate = this.currencyRates[pricing.currency] || 1;
      normalized.amount = Math.round(pricing.amount * rate * 100) / 100;
      normalized.originalAmount = pricing.amount;
      normalized.originalCurrency = pricing.currency;
    } else {
      normalized.amount = pricing.amount || 0;
    }

    if (pricing.billingPeriod) {
      normalized.billingPeriod = pricing.billingPeriod;
    }

    if (pricing.note) {
      normalized.description = pricing.note;
    }

    return normalized;
  }

  /**
   * Normalize duration
   */
  normalizeDuration(duration) {
    if (!duration || !duration.value) return null;

    // Convert everything to weeks for consistency
    let weeks = duration.value;
    
    switch (duration.unit.toLowerCase()) {
      case 'month':
      case 'months':
        weeks = duration.value * 4;
        break;
      case 'hour':
      case 'hours':
        weeks = Math.ceil(duration.value / 10); // Assume 10 hours = 1 week
        break;
      case 'day':
      case 'days':
        weeks = Math.ceil(duration.value / 7);
        break;
    }

    return {
      weeks,
      display: `${duration.value} ${duration.unit}${duration.value > 1 ? 's' : ''}`
    };
  }

  /**
   * Normalize level
   */
  normalizeLevel(level) {
    if (!level) return 'Beginner';
    
    const lower = level.toLowerCase();
    
    if (lower.includes('beginner') || lower.includes('intro')) return 'Beginner';
    if (lower.includes('intermediate')) return 'Intermediate';
    if (lower.includes('advanced')) return 'Advanced';
    if (lower.includes('graduate')) return 'Graduate';
    if (lower.includes('undergraduate')) return 'Undergraduate';
    
    return level;
  }

  /**
   * Normalize language
   */
  normalizeLanguage(language) {
    if (!language) return 'English';
    
    const languages = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'pt': 'Portuguese'
    };

    const lower = language.toLowerCase();
    
    for (const [code, name] of Object.entries(languages)) {
      if (lower.includes(code) || lower.includes(name.toLowerCase())) {
        return name;
      }
    }

    return language;
  }

  /**
   * Normalize delivery mode
   */
  normalizeDeliveryMode(mode) {
    if (!mode) return 'online';
    
    const lower = mode.toLowerCase();
    
    if (lower.includes('online') || lower.includes('remote')) return 'online';
    if (lower.includes('person') || lower.includes('campus')) return 'in-person';
    if (lower.includes('hybrid') || lower.includes('blended')) return 'hybrid';
    
    return 'online';
  }

  /**
   * Parse date string
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    } catch (error) {
      logger.warn(`Failed to parse date: ${dateString}`);
      return null;
    }
  }

  /**
   * Generate course code
   */
  generateCourseCode(data) {
    const prefix = data.university ? data.university.substring(0, 3).toUpperCase() : 'CRS';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  }

  /**
   * Find or create university
   */
  async findOrCreateUniversity(universityName, source) {
    if (!universityName) {
      throw new Error('University name is required');
    }

    let university = await University.findOne({ 
      name: { $regex: new RegExp(`^${universityName}$`, 'i') }
    });

    if (!university) {
      university = await University.create({
        name: universityName,
        type: source && source.toLowerCase().includes('university') ? 'university' : 'platform',
        isVerified: false,
        partnerTier: 'free'
      });

      logger.info(`Created new university: ${universityName}`);
    }

    return university;
  }

  /**
   * Process instructors
   */
  async processInstructors(instructorNames, universityId) {
    const instructorIds = [];

    for (const name of instructorNames) {
      if (!name || name.trim().length === 0) continue;

      const [firstName, ...lastNameParts] = name.trim().split(' ');
      const lastName = lastNameParts.join(' ');

      let instructor = await Instructor.findOne({ firstName, lastName, university: universityId });

      if (!instructor) {
        instructor = await Instructor.create({
          firstName,
          lastName,
          university: universityId
        });

        logger.info(`Created new instructor: ${name}`);
      }

      instructorIds.push(instructor._id);
    }

    return instructorIds;
  }

  /**
   * Find or create category
   */
  async findOrCreateCategory(categoryName) {
    if (!categoryName) return null;

    const cleaned = this.cleanText(categoryName);

    let category = await Category.findOne({
      name: { $regex: new RegExp(`^${cleaned}$`, 'i') }
    });

    if (!category) {
      category = await Category.create({
        name: cleaned,
        level: 0
      });

      logger.info(`Created new category: ${cleaned}`);
    }

    return category;
  }

  /**
   * Save or update course
   */
  async saveOrUpdateCourse(courseData, sourceUrl) {
    // Check if course already exists from same source
    let course = await Course.findOne({ sourceUrl });

    if (course) {
      // Update existing course
      Object.assign(course, courseData);
      course.lastScrapedAt = new Date();
      await course.save();
      
      logger.info(`Updated existing course: ${courseData.title}`);
    } else {
      // Create new course
      course = await Course.create(courseData);
      
      logger.info(`Created new course: ${courseData.title}`);
    }

    return course;
  }
}

module.exports = DataProcessor;
