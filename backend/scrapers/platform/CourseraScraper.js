const BaseScraper = require('../BaseScraper');

class CourseraScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 3000 // Coursera has stricter rate limiting
    });
    
    this.baseUrl = 'https://www.coursera.org';
  }

  async scrape(searchQuery = 'computer science') {
    try {
      this.logger.info('Starting Coursera scraping...');
      
      const searchUrl = `${this.baseUrl}/search?query=${encodeURIComponent(searchQuery)}`;
      await this.navigateWithRetry(searchUrl);
      
      // Wait for search results to load
      await this.waitForDynamicContent('[data-e2e="SearchResults"]', 15000);
      await this.scrollToBottom(3);

      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} Coursera courses`);

      const courses = [];
      const limitedLinks = courseLinks.slice(0, 10);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping Coursera course ${index + 1}/${limitedLinks.length}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape Coursera course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} Coursera courses`);
      return courses;
    } catch (error) {
      this.logger.error('Coursera scraping failed:', error);
      throw error;
    }
  }

  async extractCourseLinks() {
    return await this.extractMultiple('a[href*="/learn/"]', elements => {
      return [...new Set(elements.map(el => {
        const href = el.href;
        if (href.includes('/learn/') && !href.includes('#') && !href.includes('?')) {
          return href.split('?')[0]; // Remove query params
        }
        return null;
      }).filter(Boolean))];
    });
  }

  async scrapeCourseDetails(url) {
    try {
      await this.navigateWithRetry(url);
      await this.sleep(2000); // Wait for dynamic content

      const courseData = {
        source: 'Coursera',
        sourceUrl: url,
        scrapedAt: new Date(),
        rawData: {}
      };

      // Extract title
      courseData.title = await this.extractText('h1', 'Untitled Course');

      // Extract provider/university
      const provider = await this.extractText('[data-e2e="partner-name"], .partner-name', '');
      courseData.university = provider || 'Coursera';

      // Extract description
      courseData.description = await this.extractText('[data-e2e="course-description"], .description', '');

      // Extract rating
      const ratingText = await this.extractText('[data-e2e="ratings"], .ratings', '');
      if (ratingText) {
        const match = ratingText.match(/([\d.]+)/);
        if (match) {
          courseData.rating = parseFloat(match[1]);
        }
      }

      // Extract enrollment count
      const enrollText = await this.extractText('.enrollment-count', '');
      if (enrollText) {
        courseData.rawData.enrollmentText = enrollText;
      }

      // Extract level
      const levelText = await this.extractText('[data-e2e="level"], .difficulty', '');
      if (levelText) {
        courseData.level = this.normalizeLevel(levelText);
      }

      // Extract duration
      const durationText = await this.extractText('[data-e2e="duration"], .duration', '');
      if (durationText) {
        const match = durationText.match(/(\d+)\s*(week|month|hour)/i);
        if (match) {
          courseData.duration = {
            value: parseInt(match[1]),
            unit: match[2].toLowerCase()
          };
        }
      }

      // Extract skills
      courseData.skills = await this.extractMultiple('[data-e2e="skill"], .skill-tag', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract syllabus
      courseData.syllabus = await this.extractMultiple('.module-name, .week-name', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Pricing - Coursera has freemium model
      const auditText = await this.extractText('[data-e2e="audit-option"]', '');
      const hasFreeAudit = auditText.toLowerCase().includes('audit') || 
                          auditText.toLowerCase().includes('free');

      if (hasFreeAudit) {
        courseData.pricing = {
          type: 'freemium',
          amount: 0,
          currency: 'USD',
          note: 'Free to audit, certificate available for purchase'
        };
      } else {
        // Try to extract price
        const priceText = await this.extractText('.price, [data-e2e="price"]', '');
        const match = priceText.match(/\$?([\d,]+)/);
        
        courseData.pricing = {
          type: match ? 'subscription' : 'freemium',
          amount: match ? parseFloat(match[1].replace(',', '')) : 49,
          currency: 'USD',
          billingPeriod: 'monthly'
        };
      }

      // Extract instructors
      courseData.instructors = await this.extractMultiple('.instructor-name', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract languages
      const langText = await this.extractText('[data-e2e="languages"], .language-info', '');
      courseData.language = langText || 'English';

      // Coursera metadata
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

      this.logger.info(`Successfully scraped Coursera course: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape Coursera course from ${url}:`, error.message);
      return null;
    }
  }

  normalizeLevel(text) {
    const lower = text.toLowerCase();
    if (lower.includes('beginner')) return 'Beginner';
    if (lower.includes('intermediate')) return 'Intermediate';
    if (lower.includes('advanced')) return 'Advanced';
    return text;
  }
}

module.exports = CourseraScraper;
