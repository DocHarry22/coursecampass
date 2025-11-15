const BaseScraper = require('../BaseScraper');

class UCTScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 2000
    });
    
    this.baseUrl = 'https://www.uct.ac.za';
  }

  async scrape(startUrl = 'https://www.uct.ac.za/study/programmes') {
    try {
      this.logger.info('Starting University of Cape Town scraping...');
      
      await this.navigateWithRetry(startUrl);
      await this.waitForDynamicContent('.programme-item, .course-listing', 15000);
      await this.scrollToBottom(5);

      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} UCT courses`);

      const courses = [];
      const limitedLinks = courseLinks.slice(0, 15);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping UCT course ${index + 1}/${limitedLinks.length}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape UCT course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} UCT courses`);
      return courses;
    } catch (error) {
      this.logger.error('UCT scraping failed:', error);
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
        source: 'University of Cape Town',
        sourceUrl: url,
        university: 'University of Cape Town',
        scrapedAt: new Date(),
        rawData: {}
      };

      courseData.title = await this.extractText('h1.programme-name, h1', 'Untitled Course');
      courseData.courseCode = await this.extractText('.programme-code, .saqa-id', '');
      courseData.description = await this.extractText('.programme-description, .overview', '');

      // Extract faculty
      const faculty = await this.extractText('.faculty, .department', '');
      if (faculty) {
        courseData.rawData.faculty = faculty;
        courseData.department = faculty;
      }

      // Extract degree type and level
      const degreeType = await this.extractText('.degree-type, .qualification', '');
      if (degreeType) {
        courseData.rawData.degreeType = degreeType;
        
        const lower = degreeType.toLowerCase();
        if (lower.includes('phd') || lower.includes('doctorate')) {
          courseData.level = 'Doctorate';
        } else if (lower.includes('masters') || lower.includes('mphil')) {
          courseData.level = 'Graduate';
        } else if (lower.includes('honours') || lower.includes('postgraduate diploma')) {
          courseData.level = 'Graduate';
        } else if (lower.includes('bachelor')) {
          courseData.level = 'Undergraduate';
        } else if (lower.includes('diploma') || lower.includes('certificate')) {
          courseData.level = 'Certificate';
        }
      }

      // Extract duration
      const durationText = await this.extractText('.duration, .programme-duration', '');
      if (durationText) {
        const yearMatch = durationText.match(/(\d+)\s*year/i);
        const monthMatch = durationText.match(/(\d+)\s*month/i);
        
        if (yearMatch) {
          courseData.duration = {
            value: parseInt(yearMatch[1]) * 52,
            unit: 'weeks',
            display: `${yearMatch[1]} year${yearMatch[1] > 1 ? 's' : ''}`
          };
        } else if (monthMatch) {
          courseData.duration = {
            value: parseInt(monthMatch[1]) * 4,
            unit: 'weeks',
            display: `${monthMatch[1]} month${monthMatch[1] > 1 ? 's' : ''}`
          };
        }
      }

      // Extract entry requirements
      const requirements = await this.extractText('.entry-requirements, .admission-requirements', '');
      if (requirements) {
        courseData.prerequisites = requirements;
      }

      // Extract APS/NBT requirements
      const apsText = await this.extractText('.aps-score, .nbt-score', '');
      if (apsText) {
        const apsMatch = apsText.match(/APS[:\s]*(\d+)/i);
        const nbtMatch = apsText.match(/NBT/i);
        
        if (apsMatch) {
          courseData.rawData.minimumAPS = parseInt(apsMatch[1]);
        }
        if (nbtMatch) {
          courseData.rawData.requiresNBT = true;
        }
      }

      // Extract study mode
      const studyMode = await this.extractText('.study-mode, .attendance', '');
      if (studyMode) {
        const lower = studyMode.toLowerCase();
        if (lower.includes('full-time') || lower.includes('contact')) {
          courseData.deliveryMode = 'in-person';
        } else if (lower.includes('online') || lower.includes('distance')) {
          courseData.deliveryMode = 'online';
        } else if (lower.includes('part-time') || lower.includes('block')) {
          courseData.deliveryMode = 'hybrid';
        }
      } else {
        courseData.deliveryMode = 'in-person';
      }

      // Extract fees
      const feesText = await this.extractText('.fees, .tuition-fees, .programme-fees', '');
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

      // Extract curriculum/modules
      courseData.syllabus = await this.extractMultiple('.curriculum-item, .course-module', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract credits
      const creditsText = await this.extractText('.credits, .credit-hours', '');
      if (creditsText) {
        const match = creditsText.match(/(\d+)/);
        if (match) {
          courseData.credits = parseInt(match[1]);
        }
      }

      // Extract application deadlines
      const deadline = await this.extractText('.application-deadline, .closing-date', '');
      if (deadline) {
        courseData.rawData.applicationDeadline = deadline;
      }

      // Extract contact information
      const contact = await this.extractText('.contact-info, .programme-enquiries', '');
      if (contact) {
        courseData.rawData.contactInfo = contact;
      }

      // UCT research outputs
      const researchFocus = await this.extractText('.research-focus, .specialisation', '');
      if (researchFocus) {
        courseData.rawData.researchFocus = researchFocus;
      }

      courseData.language = 'English';
      courseData.isActive = true;

      courseData.certification = {
        available: true,
        type: degreeType || 'degree',
        isPaid: false
      };

      // UCT is well-ranked, add metadata
      courseData.rawData.ranking = 'Top African University';

      this.logger.info(`Successfully scraped UCT course: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape UCT course from ${url}:`, error.message);
      return null;
    }
  }
}

module.exports = UCTScraper;
