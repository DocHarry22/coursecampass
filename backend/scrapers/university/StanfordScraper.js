const BaseScraper = require('../BaseScraper');

class StanfordScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 2000
    });
    
    this.baseUrl = 'https://online.stanford.edu';
  }

  async scrape(startUrl = 'https://online.stanford.edu/courses') {
    try {
      this.logger.info('Starting Stanford Online scraping...');
      
      await this.navigateWithRetry(startUrl);
      
      // Wait for course cards to load
      await this.waitForDynamicContent('.course-card, .views-row', 15000);
      
      // Scroll to load all courses
      await this.scrollToBottom(5);

      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} Stanford courses`);

      const courses = [];
      const limitedLinks = courseLinks.slice(0, 10);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping Stanford course ${index + 1}/${limitedLinks.length}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape Stanford course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} Stanford courses`);
      return courses;
    } catch (error) {
      this.logger.error('Stanford scraping failed:', error);
      throw error;
    }
  }

  async extractCourseLinks() {
    return await this.extractMultiple('.course-card a, .views-row a.course-link', elements => {
      return [...new Set(elements.map(el => {
        const href = el.href;
        if (href.includes('/courses/') && !href.includes('#')) {
          return href;
        }
        return null;
      }).filter(Boolean))];
    });
  }

  async scrapeCourseDetails(url) {
    try {
      await this.navigateWithRetry(url);

      const courseData = {
        source: 'Stanford Online',
        sourceUrl: url,
        university: 'Stanford University',
        scrapedAt: new Date(),
        rawData: {}
      };

      courseData.title = await this.extractText('h1.page-title, h1.course-title, h1', 'Untitled Course');
      courseData.courseCode = await this.extractText('.course-code, .course-number', '');
      
      // Extract description
      courseData.description = await this.extractText('.course-description, .field--name-body, .description', '');
      
      // Extract instructors
      courseData.instructors = await this.extractMultiple('.instructor, .faculty-name', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract duration
      const durationText = await this.extractText('.duration, .course-length', '');
      courseData.duration = this.parseDuration(durationText);

      // Extract pricing
      const priceText = await this.extractText('.price, .course-price', '');
      courseData.pricing = this.parsePrice(priceText);

      // Extract level
      const levelText = await this.extractText('.level, .difficulty', '');
      if (levelText) {
        courseData.level = this.parseLevel(levelText);
      }

      // Extract format
      const formatText = await this.extractText('.format, .course-format', '');
      if (formatText.toLowerCase().includes('self-paced')) {
        courseData.format = 'self-paced';
      } else if (formatText.toLowerCase().includes('instructor-led')) {
        courseData.format = 'instructor-led';
      }

      // Extract dates
      const startDate = await this.extractText('.start-date', '');
      const endDate = await this.extractText('.end-date', '');
      
      if (startDate) {
        courseData.startDate = startDate;
      }
      if (endDate) {
        courseData.endDate = endDate;
      }

      courseData.deliveryMode = 'online';
      courseData.language = 'English';
      courseData.isActive = true;

      // Certificate info
      const hasCertificate = await this.page.$('.certificate, [data-certificate]');
      courseData.certification = {
        available: !!hasCertificate,
        type: hasCertificate ? 'certificate' : 'none'
      };

      this.logger.info(`Successfully scraped Stanford course: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape Stanford course from ${url}:`, error.message);
      return null;
    }
  }

  parseDuration(text) {
    const match = text.match(/(\d+)\s*(week|month|hour)/i);
    if (match) {
      return {
        value: parseInt(match[1]),
        unit: match[2].toLowerCase()
      };
    }
    return null;
  }

  parsePrice(text) {
    if (!text || text.toLowerCase().includes('free')) {
      return { type: 'free', amount: 0, currency: 'USD' };
    }

    const match = text.match(/\$?([\d,]+)/);
    if (match) {
      return {
        type: 'paid',
        amount: parseFloat(match[1].replace(',', '')),
        currency: 'USD'
      };
    }

    return { type: 'unknown', amount: null, currency: 'USD' };
  }

  parseLevel(text) {
    const lower = text.toLowerCase();
    if (lower.includes('beginner') || lower.includes('introductory')) return 'Beginner';
    if (lower.includes('intermediate')) return 'Intermediate';
    if (lower.includes('advanced')) return 'Advanced';
    return text;
  }
}

module.exports = StanfordScraper;
