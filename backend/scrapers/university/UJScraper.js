const BaseScraper = require('../BaseScraper');

class UJScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 2000
    });
    
    this.baseUrl = 'https://www.uj.ac.za';
  }

  async scrape(startUrl = 'https://www.uj.ac.za/faculties/') {
    try {
      this.logger.info('Starting University of Johannesburg scraping...');
      
      await this.navigateWithRetry(startUrl);
      await this.waitForDynamicContent('.programme-item, .qualification-item', 15000);
      await this.scrollToBottom(5);

      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} UJ courses`);

      const courses = [];
      const limitedLinks = courseLinks.slice(0, 15);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping UJ course ${index + 1}/${limitedLinks.length}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape UJ course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} UJ courses`);
      return courses;
    } catch (error) {
      this.logger.error('UJ scraping failed:', error);
      throw error;
    }
  }

  async extractCourseLinks() {
    return await this.extractMultiple('a[href*="/programme"], a[href*="/qualification"]', elements => {
      return [...new Set(elements.map(el => {
        const href = el.href;
        if ((href.includes('/programme') || href.includes('/qualification')) && !href.includes('#')) {
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
        source: 'University of Johannesburg',
        sourceUrl: url,
        university: 'University of Johannesburg',
        scrapedAt: new Date(),
        rawData: {}
      };

      courseData.title = await this.extractText('h1.page-title, h1', 'Untitled Course');
      courseData.courseCode = await this.extractText('.saqa-id, .programme-code', '');
      courseData.description = await this.extractText('.programme-overview, .description', '');

      // Extract faculty
      const faculty = await this.extractText('.faculty, .faculty-name', '');
      if (faculty) {
        courseData.rawData.faculty = faculty;
        courseData.department = faculty;
      }

      // Extract SAQA level (South African Qualifications Authority)
      const saqaLevel = await this.extractText('.nqf-level, .saqa-level', '');
      if (saqaLevel) {
        courseData.rawData.NQFLevel = saqaLevel;
        
        // Map NQF levels to our levels
        const levelNum = parseInt(saqaLevel.match(/(\d+)/)?.[1] || '0');
        if (levelNum >= 9) {
          courseData.level = 'Doctorate';
        } else if (levelNum >= 8) {
          courseData.level = 'Graduate';
        } else if (levelNum >= 5) {
          courseData.level = 'Undergraduate';
        } else {
          courseData.level = 'Certificate';
        }
      }

      // Extract duration
      const durationText = await this.extractText('.duration, .minimum-duration', '');
      if (durationText) {
        const yearMatch = durationText.match(/(\d+)\s*year/i);
        
        if (yearMatch) {
          courseData.duration = {
            value: parseInt(yearMatch[1]) * 52,
            unit: 'weeks',
            display: `${yearMatch[1]} year${yearMatch[1] > 1 ? 's' : ''}`
          };
        }
      }

      // Extract qualification type
      const qualType = await this.extractText('.qualification-type, .award-type', '');
      if (qualType) {
        courseData.rawData.qualificationType = qualType;
      }

      // Extract minimum admission requirements
      const minRequirements = await this.extractText('.minimum-requirements, .entry-requirements', '');
      if (minRequirements) {
        courseData.prerequisites = minRequirements;
      }

      // Extract APS requirements
      const apsText = await this.extractText('.aps-requirements, .aps-score', '');
      if (apsText) {
        const match = apsText.match(/(\d+)/);
        if (match) {
          courseData.rawData.minimumAPS = parseInt(match[1]);
        }
      }

      // Mode of delivery
      const modeText = await this.extractText('.mode-of-delivery, .study-mode', '');
      if (modeText) {
        const lower = modeText.toLowerCase();
        if (lower.includes('distance') || lower.includes('online')) {
          courseData.deliveryMode = 'online';
        } else if (lower.includes('contact') || lower.includes('full-time')) {
          courseData.deliveryMode = 'in-person';
        } else {
          courseData.deliveryMode = 'hybrid';
        }
      } else {
        courseData.deliveryMode = 'in-person';
      }

      // Extract fees
      const feesText = await this.extractText('.fees, .tuition-fees', '');
      if (feesText) {
        const match = feesText.match(/R\s*([\d,\s]+)/);
        if (match) {
          const zarAmount = parseFloat(match[1].replace(/,/g, '').replace(/\s/g, ''));
          courseData.pricing = {
            type: 'paid',
            amount: Math.round(zarAmount / 18),
            currency: 'USD',
            originalAmount: zarAmount,
            originalCurrency: 'ZAR'
          };
        }
      }

      // Extract modules/subjects
      courseData.syllabus = await this.extractMultiple('.module-list li, .subject-list li', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract credits
      const creditsText = await this.extractText('.credits, .credit-value', '');
      if (creditsText) {
        const match = creditsText.match(/(\d+)/);
        if (match) {
          courseData.credits = parseInt(match[1]);
        }
      }

      // Extract career opportunities (useful info)
      const careers = await this.extractMultiple('.career-opportunities li', elements => {
        return elements.map(el => el.textContent.trim());
      });
      
      if (careers.length > 0) {
        courseData.rawData.careerOpportunities = careers;
      }

      // Language - UJ offers programs in English and Afrikaans
      const langText = await this.extractText('.language-of-instruction', '');
      courseData.language = langText || 'English';

      courseData.isActive = true;

      courseData.certification = {
        available: true,
        type: qualType || 'degree',
        isPaid: false
      };

      this.logger.info(`Successfully scraped UJ course: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape UJ course from ${url}:`, error.message);
      return null;
    }
  }
}

module.exports = UJScraper;
