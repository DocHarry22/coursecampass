const BaseScraper = require('../BaseScraper');

class UPScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 2000
    });
    
    this.baseUrl = 'https://www.up.ac.za';
  }

  async scrape(startUrl = 'https://www.up.ac.za/programmes') {
    try {
      this.logger.info('Starting University of Pretoria scraping...');
      
      await this.navigateWithRetry(startUrl);
      await this.waitForDynamicContent('.programme-item, .course-item', 15000);
      await this.scrollToBottom(5);

      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} UP courses`);

      const courses = [];
      const limitedLinks = courseLinks.slice(0, 15);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping UP course ${index + 1}/${limitedLinks.length}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape UP course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} UP courses`);
      return courses;
    } catch (error) {
      this.logger.error('UP scraping failed:', error);
      throw error;
    }
  }

  async extractCourseLinks() {
    return await this.extractMultiple('a[href*="/programme"], a[href*="/course"]', elements => {
      return [...new Set(elements.map(el => {
        const href = el.href;
        if ((href.includes('/programme') || href.includes('/course')) && !href.includes('#')) {
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
        source: 'University of Pretoria',
        sourceUrl: url,
        university: 'University of Pretoria',
        scrapedAt: new Date(),
        rawData: {}
      };

      courseData.title = await this.extractText('h1.programme-title, h1', 'Untitled Course');
      courseData.courseCode = await this.extractText('.programme-code, .course-code', '');
      courseData.description = await this.extractText('.programme-description, .description', '');

      // Extract faculty
      const faculty = await this.extractText('.faculty-name, .faculty', '');
      if (faculty) {
        courseData.rawData.faculty = faculty;
        courseData.department = faculty;
      }

      // Extract duration
      const durationText = await this.extractText('.duration, .study-duration', '');
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

      // Extract qualification
      const qualification = await this.extractText('.qualification, .award', '');
      if (qualification) {
        courseData.rawData.qualification = qualification;
        
        // Determine level
        const lowerQual = qualification.toLowerCase();
        if (lowerQual.includes('phd') || lowerQual.includes('doctorate')) {
          courseData.level = 'Doctorate';
        } else if (lowerQual.includes('masters') || lowerQual.includes('msc') || lowerQual.includes('ma')) {
          courseData.level = 'Graduate';
        } else if (lowerQual.includes('honours')) {
          courseData.level = 'Graduate';
        } else if (lowerQual.includes('bachelor') || lowerQual.includes('bsc') || lowerQual.includes('ba')) {
          courseData.level = 'Undergraduate';
        } else if (lowerQual.includes('diploma') || lowerQual.includes('certificate')) {
          courseData.level = 'Certificate';
        }
      }

      // Extract admission requirements
      const admissionReqs = await this.extractMultiple('.admission-requirement li, .entry-requirement li', elements => {
        return elements.map(el => el.textContent.trim());
      });
      
      if (admissionReqs.length > 0) {
        courseData.prerequisites = admissionReqs.join('; ');
      }

      // Extract minimum APS
      const apsText = await this.extractText('.aps, .minimum-aps', '');
      if (apsText) {
        const match = apsText.match(/(\d+)/);
        if (match) {
          courseData.rawData.minimumAPS = parseInt(match[1]);
        }
      }

      // Extract study mode
      const studyMode = await this.extractText('.study-mode, .mode-of-delivery', '');
      if (studyMode) {
        const lower = studyMode.toLowerCase();
        if (lower.includes('distance') || lower.includes('online')) {
          courseData.deliveryMode = 'online';
        } else if (lower.includes('hybrid') || lower.includes('blended')) {
          courseData.deliveryMode = 'hybrid';
        } else {
          courseData.deliveryMode = 'in-person';
        }
      } else {
        courseData.deliveryMode = 'in-person';
      }

      // Extract tuition fees
      const feesText = await this.extractText('.fees, .tuition, .programme-fees', '');
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

      // Extract modules/curriculum
      courseData.syllabus = await this.extractMultiple('.module-name, .curriculum-item', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract closing dates
      const closingDate = await this.extractText('.closing-date, .application-deadline', '');
      if (closingDate) {
        courseData.rawData.applicationDeadline = closingDate;
      }

      courseData.language = 'English'; // UP is primarily English medium
      courseData.isActive = true;

      courseData.certification = {
        available: true,
        type: qualification || 'degree',
        isPaid: false
      };

      this.logger.info(`Successfully scraped UP course: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape UP course from ${url}:`, error.message);
      return null;
    }
  }
}

module.exports = UPScraper;
