const BaseScraper = require('../BaseScraper');

class FutureLearnScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 2000
    });
    
    this.baseUrl = 'https://www.futurelearn.com';
  }

  async scrape(searchQuery = 'business') {
    try {
      this.logger.info('Starting FutureLearn scraping...');
      
      const searchUrl = `${this.baseUrl}/courses?q=${encodeURIComponent(searchQuery)}`;
      await this.navigateWithRetry(searchUrl);
      
      await this.waitForDynamicContent('.course-card', 15000);
      await this.scrollToBottom(3);

      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} FutureLearn courses`);

      const courses = [];
      const limitedLinks = courseLinks.slice(0, 10);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping FutureLearn course ${index + 1}/${limitedLinks.length}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape FutureLearn course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} FutureLearn courses`);
      return courses;
    } catch (error) {
      this.logger.error('FutureLearn scraping failed:', error);
      throw error;
    }
  }

  async extractCourseLinks() {
    return await this.extractMultiple('a[href*="/courses/"]', elements => {
      return [...new Set(elements.map(el => {
        const href = el.href;
        if (href.includes('/courses/') && !href.includes('#')) {
          return href.split('?')[0];
        }
        return null;
      }).filter(Boolean))];
    });
  }

  async scrapeCourseDetails(url) {
    try {
      await this.navigateWithRetry(url);
      await this.sleep(2000);

      const courseData = {
        source: 'FutureLearn',
        sourceUrl: url,
        scrapedAt: new Date(),
        rawData: {}
      };

      courseData.title = await this.extractText('h1.course-header__title, h1', 'Untitled Course');

      // Extract partner/university
      const partner = await this.extractText('.partner-name, .course-partner', '');
      courseData.university = partner || 'FutureLearn';

      courseData.description = await this.extractText('.course-description, .about-course', '');

      // Extract duration
      const durationText = await this.extractText('.duration, .course-duration', '');
      if (durationText) {
        const match = durationText.match(/(\d+)\s*(week|month)/i);
        if (match) {
          courseData.duration = {
            value: parseInt(match[1]),
            unit: match[2].toLowerCase()
          };
        }
      }

      // Extract weekly study hours
      const effortText = await this.extractText('.weekly-study, .effort', '');
      if (effortText) {
        courseData.rawData.weeklyEffort = effortText;
      }

      // Extract level
      const levelText = await this.extractText('.level, .difficulty', '');
      if (levelText) {
        courseData.level = this.normalizeLevel(levelText);
      }

      // FutureLearn pricing model
      const upgradeText = await this.extractText('.upgrade-info, .pricing', '');
      const hasFreeOption = upgradeText.toLowerCase().includes('free') || 
                           upgradeText.toLowerCase().includes('limited access');

      if (hasFreeOption) {
        courseData.pricing = {
          type: 'freemium',
          amount: 0,
          currency: 'GBP',
          note: 'Limited free access, upgrade for full access and certificate'
        };
      } else {
        const match = upgradeText.match(/[£$]([\d,]+)/);
        courseData.pricing = {
          type: 'subscription',
          amount: match ? parseFloat(match[1].replace(',', '')) : 39,
          currency: match && upgradeText.includes('£') ? 'GBP' : 'USD',
          billingPeriod: 'monthly'
        };
      }

      // Extract what you'll learn
      courseData.syllabus = await this.extractMultiple('.what-you-learn li, .learning-outcomes li', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract instructors/educators
      courseData.instructors = await this.extractMultiple('.educator-name, .instructor', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract next run date
      const startDateText = await this.extractText('.next-run, .start-date', '');
      if (startDateText) {
        courseData.startDate = startDateText;
      }

      courseData.deliveryMode = 'online';
      courseData.format = 'cohort-based'; // FutureLearn uses cohorts
      courseData.language = 'English';
      courseData.isActive = true;

      courseData.certification = {
        available: true,
        type: 'certificate of achievement',
        isPaid: true
      };

      courseData.accessibility = {
        closedCaptions: true,
        transcripts: true
      };

      // Extract course category
      const categoryText = await this.extractText('.category, .subject', '');
      if (categoryText) {
        courseData.rawData.category = categoryText;
      }

      this.logger.info(`Successfully scraped FutureLearn course: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape FutureLearn course from ${url}:`, error.message);
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

module.exports = FutureLearnScraper;
