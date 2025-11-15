const BaseScraper = require('../BaseScraper');

class WitsScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 2000
    });
    
    this.baseUrl = 'https://www.wits.ac.za';
  }

  async scrape(startUrl = 'https://www.wits.ac.za/course-finder/') {
    try {
      this.logger.info('Starting University of Witwatersrand scraping...');
      
      await this.navigateWithRetry(startUrl);
      await this.waitForDynamicContent('.course-item, .course-card, .programme-item', 15000);
      await this.scrollToBottom(5);

      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} Wits courses`);

      const courses = [];
      const limitedLinks = courseLinks.slice(0, 15);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping Wits course ${index + 1}/${limitedLinks.length}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape Wits course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} Wits courses`);
      return courses;
    } catch (error) {
      this.logger.error('Wits scraping failed:', error);
      throw error;
    }
  }

  async extractCourseLinks() {
    return await this.extractMultiple('a[href*="/course"], a[href*="/programme"], .course-link', elements => {
      return [...new Set(elements.map(el => {
        const href = el.href;
        if ((href.includes('/course') || href.includes('/programme')) && !href.includes('#')) {
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
        source: 'University of Witwatersrand',
        sourceUrl: url,
        university: 'University of the Witwatersrand',
        scrapedAt: new Date(),
        rawData: {}
      };

      courseData.title = await this.extractText('h1.course-title, h1.programme-title, h1', 'Untitled Course');
      courseData.courseCode = await this.extractText('.course-code, .programme-code', '');
      courseData.description = await this.extractText('.course-description, .programme-description, .description', '');

      // Extract faculty/school
      const faculty = await this.extractText('.faculty, .school', '');
      if (faculty) {
        courseData.rawData.faculty = faculty;
        courseData.department = faculty;
      }

      // Extract duration
      const durationText = await this.extractText('.duration, .course-duration', '');
      if (durationText) {
        const yearMatch = durationText.match(/(\d+)\s*year/i);
        const semesterMatch = durationText.match(/(\d+)\s*semester/i);
        
        if (yearMatch) {
          courseData.duration = {
            value: parseInt(yearMatch[1]) * 52,
            unit: 'weeks',
            display: `${yearMatch[1]} year${yearMatch[1] > 1 ? 's' : ''}`
          };
        } else if (semesterMatch) {
          courseData.duration = {
            value: parseInt(semesterMatch[1]) * 16,
            unit: 'weeks',
            display: `${semesterMatch[1]} semester${semesterMatch[1] > 1 ? 's' : ''}`
          };
        }
      }

      // Extract qualification type
      const qualType = await this.extractText('.qualification-type, .award-type', '');
      if (qualType) {
        courseData.rawData.qualificationType = qualType;
        
        // Determine level based on qualification
        if (qualType.toLowerCase().includes('honours') || qualType.toLowerCase().includes('postgraduate')) {
          courseData.level = 'Graduate';
        } else if (qualType.toLowerCase().includes('masters') || qualType.toLowerCase().includes('phd')) {
          courseData.level = 'Graduate';
        } else if (qualType.toLowerCase().includes('bachelor') || qualType.toLowerCase().includes('undergraduate')) {
          courseData.level = 'Undergraduate';
        } else if (qualType.toLowerCase().includes('diploma') || qualType.toLowerCase().includes('certificate')) {
          courseData.level = 'Certificate';
        }
      }

      // Extract entry requirements
      const requirements = await this.extractText('.entry-requirements, .admission-requirements', '');
      if (requirements) {
        courseData.prerequisites = requirements;
      }

      // Extract APS score requirement
      const apsText = await this.extractText('.aps-score, .minimum-aps', '');
      if (apsText) {
        const apsMatch = apsText.match(/(\d+)/);
        if (apsMatch) {
          courseData.rawData.minimumAPS = parseInt(apsMatch[1]);
        }
      }

      // South African universities are primarily in-person
      courseData.deliveryMode = 'in-person';
      
      // Check for online/distance learning options
      const modeText = await this.extractText('.delivery-mode, .study-mode', '');
      if (modeText && (modeText.toLowerCase().includes('online') || modeText.toLowerCase().includes('distance'))) {
        courseData.deliveryMode = 'hybrid';
      }

      // Extract fees/pricing
      const feesText = await this.extractText('.fees, .tuition-fees, .course-fees', '');
      if (feesText) {
        const match = feesText.match(/R\s*([\d,\s]+)/);
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, '').replace(/\s/g, ''));
          courseData.pricing = {
            type: 'paid',
            amount: Math.round(amount / 18), // Convert ZAR to USD (approx rate)
            currency: 'USD',
            originalAmount: amount,
            originalCurrency: 'ZAR'
          };
        }
      }

      // Extract modules/syllabus
      courseData.syllabus = await this.extractMultiple('.module-item, .course-module li', elements => {
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

      courseData.language = 'English';
      courseData.isActive = true;

      // Wits degrees typically include certification
      courseData.certification = {
        available: true,
        type: qualType || 'degree',
        isPaid: false
      };

      // Extract contact/coordinator info
      const coordinator = await this.extractText('.coordinator, .contact-person', '');
      if (coordinator) {
        courseData.rawData.coordinator = coordinator;
      }

      this.logger.info(`Successfully scraped Wits course: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape Wits course from ${url}:`, error.message);
      return null;
    }
  }
}

module.exports = WitsScraper;
