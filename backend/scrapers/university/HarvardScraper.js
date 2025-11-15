const BaseScraper = require('../BaseScraper');

class HarvardScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 2000
    });
    
    this.baseUrl = 'https://pll.harvard.edu';
  }

  async scrape(startUrl = 'https://pll.harvard.edu/catalog') {
    try {
      this.logger.info('Starting Harvard Online Learning scraping...');
      
      await this.navigateWithRetry(startUrl);
      await this.waitForDynamicContent('.course-block, .group-details', 15000);
      await this.scrollToBottom(5);

      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} Harvard courses`);

      const courses = [];
      const limitedLinks = courseLinks.slice(0, 10);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping Harvard course ${index + 1}/${limitedLinks.length}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape Harvard course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} Harvard courses`);
      return courses;
    } catch (error) {
      this.logger.error('Harvard scraping failed:', error);
      throw error;
    }
  }

  async extractCourseLinks() {
    return await this.extractMultiple('.course-block a, a[href*="/course/"]', elements => {
      return [...new Set(elements.map(el => {
        const href = el.href;
        if (href.includes('/course/') && !href.includes('#')) {
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
        source: 'Harvard Online Learning',
        sourceUrl: url,
        university: 'Harvard University',
        scrapedAt: new Date(),
        rawData: {}
      };

      courseData.title = await this.extractText('h1.page-title, h1', 'Untitled Course');
      courseData.courseCode = await this.extractText('.course-code', '');
      courseData.description = await this.extractText('.course-description, .field--name-body', '');

      // Extract instructors
      courseData.instructors = await this.extractMultiple('.instructor-name, .faculty', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract what you'll learn / syllabus
      courseData.syllabus = await this.extractMultiple('.what-you-will-learn li, .syllabus-item', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract duration
      const durationText = await this.extractText('.duration, .course-length', '');
      if (durationText) {
        const match = durationText.match(/(\d+)\s*(week|month|hour)/i);
        if (match) {
          courseData.duration = {
            value: parseInt(match[1]),
            unit: match[2].toLowerCase()
          };
        }
      }

      // Extract pricing
      const priceText = await this.extractText('.price, .tuition', '');
      if (priceText) {
        if (priceText.toLowerCase().includes('free')) {
          courseData.pricing = { type: 'free', amount: 0, currency: 'USD' };
        } else {
          const match = priceText.match(/\$?([\d,]+)/);
          if (match) {
            courseData.pricing = {
              type: 'paid',
              amount: parseFloat(match[1].replace(',', '')),
              currency: 'USD'
            };
          }
        }
      }

      // Extract level
      const levelText = await this.extractText('.level, .difficulty', '');
      if (levelText) {
        courseData.level = this.normalizeLevel(levelText);
      }

      // Extract dates
      const dateText = await this.extractText('.date-info, .session-dates', '');
      if (dateText) {
        courseData.rawData.dateText = dateText;
      }

      // Extract effort/pace
      const effortText = await this.extractText('.effort, .time-commitment', '');
      if (effortText) {
        courseData.rawData.effort = effortText;
      }

      courseData.deliveryMode = 'online';
      courseData.language = 'English';
      courseData.isActive = true;

      // Certificate
      const certText = await this.extractText('.certificate-info', '');
      courseData.certification = {
        available: certText.length > 0 || certText.toLowerCase().includes('certificate'),
        type: certText.toLowerCase().includes('verified') ? 'verified' : 'certificate'
      };

      // Extract format
      const isSelfPaced = await this.page.$('[data-format="self-paced"]') || 
                          (await this.extractText('.format', '')).toLowerCase().includes('self-paced');
      
      courseData.format = isSelfPaced ? 'self-paced' : 'instructor-led';

      this.logger.info(`Successfully scraped Harvard course: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape Harvard course from ${url}:`, error.message);
      return null;
    }
  }

  normalizeLevel(text) {
    const lower = text.toLowerCase();
    if (lower.includes('intro') || lower.includes('beginner')) return 'Beginner';
    if (lower.includes('intermediate')) return 'Intermediate';
    if (lower.includes('advanced')) return 'Advanced';
    return text;
  }
}

module.exports = HarvardScraper;
