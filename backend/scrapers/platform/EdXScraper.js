const BaseScraper = require('../BaseScraper');

class EdXScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 2500
    });
    
    this.baseUrl = 'https://www.edx.org';
  }

  async scrape(searchQuery = 'data science') {
    try {
      this.logger.info('Starting edX scraping...');
      
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(searchQuery)}`;
      await this.navigateWithRetry(searchUrl);
      
      await this.waitForDynamicContent('.discovery-card', 15000);
      await this.scrollToBottom(3);

      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} edX courses`);

      const courses = [];
      const limitedLinks = courseLinks.slice(0, 10);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping edX course ${index + 1}/${limitedLinks.length}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape edX course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} edX courses`);
      return courses;
    } catch (error) {
      this.logger.error('edX scraping failed:', error);
      throw error;
    }
  }

  async extractCourseLinks() {
    return await this.extractMultiple('a[href*="/course/"], a[href*="/learn/"]', elements => {
      return [...new Set(elements.map(el => {
        const href = el.href;
        if ((href.includes('/course/') || href.includes('/learn/')) && !href.includes('#')) {
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
        source: 'edX',
        sourceUrl: url,
        scrapedAt: new Date(),
        rawData: {}
      };

      courseData.title = await this.extractText('h1.course-title, h1', 'Untitled Course');

      // Extract university/institution
      const institution = await this.extractText('.course-org, .partner-name', '');
      courseData.university = institution || 'edX';

      courseData.description = await this.extractText('.course-description, .about-section', '');

      // Extract duration
      const durationText = await this.extractText('.course-length, .duration', '');
      if (durationText) {
        const match = durationText.match(/(\d+)\s*(week|month)/i);
        if (match) {
          courseData.duration = {
            value: parseInt(match[1]),
            unit: match[2].toLowerCase()
          };
        }
      }

      // Extract effort/pace
      const effortText = await this.extractText('.course-effort, .effort', '');
      if (effortText) {
        courseData.rawData.effort = effortText;
      }

      // Extract level
      const levelText = await this.extractText('.course-level, .level', '');
      if (levelText) {
        courseData.level = this.normalizeLevel(levelText);
      }

      // Extract pricing - edX has audit and verified tracks
      const priceText = await this.extractText('.price, .course-price', '');
      const hasAudit = await this.page.$('.audit-track, [data-track="audit"]');

      if (hasAudit || priceText.toLowerCase().includes('audit')) {
        courseData.pricing = {
          type: 'freemium',
          amount: 0,
          currency: 'USD',
          note: 'Free to audit, verified certificate available'
        };
      } else {
        const match = priceText.match(/\$?([\d,]+)/);
        courseData.pricing = {
          type: 'paid',
          amount: match ? parseFloat(match[1].replace(',', '')) : 99,
          currency: 'USD'
        };
      }

      // Extract instructors
      courseData.instructors = await this.extractMultiple('.instructor-name, .staff-name', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract syllabus/what you'll learn
      courseData.syllabus = await this.extractMultiple('.course-syllabus li, .what-you-learn li', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract start date
      const startDateText = await this.extractText('.course-start-date, .start-date', '');
      if (startDateText) {
        courseData.startDate = startDateText;
      }

      // Extract languages
      const langText = await this.extractText('.course-language, .languages', '');
      courseData.language = langText || 'English';

      courseData.deliveryMode = 'online';
      courseData.format = 'self-paced';
      courseData.isActive = true;

      courseData.certification = {
        available: true,
        type: 'verified certificate',
        isPaid: true
      };

      courseData.accessibility = {
        closedCaptions: true,
        transcripts: true
      };

      // Extract prerequisites
      const prereqText = await this.extractText('.prerequisites', '');
      if (prereqText) {
        courseData.prerequisites = prereqText;
      }

      this.logger.info(`Successfully scraped edX course: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape edX course from ${url}:`, error.message);
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

module.exports = EdXScraper;
