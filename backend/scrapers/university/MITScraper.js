const BaseScraper = require('../BaseScraper');
const cheerio = require('cheerio');

class MITScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      ...config,
      rateLimit: 2000 // Be respectful to MIT servers
    });
    
    this.baseUrl = 'https://ocw.mit.edu';
  }

  /**
   * Main scraping method for MIT OpenCourseWare
   */
  async scrape(searchUrl = 'https://ocw.mit.edu/search/') {
    try {
      this.logger.info('Starting MIT OpenCourseWare scraping...');
      
      await this.navigateWithRetry(searchUrl);
      
      // Get all course links from search results
      const courseLinks = await this.extractCourseLinks();
      this.logger.info(`Found ${courseLinks.length} courses to scrape`);

      const courses = [];
      
      // Limit to first 10 courses for prototype
      const limitedLinks = courseLinks.slice(0, 10);

      for (const [index, link] of limitedLinks.entries()) {
        try {
          this.logger.info(`Scraping course ${index + 1}/${limitedLinks.length}: ${link}`);
          const courseData = await this.scrapeCourseDetails(link);
          if (courseData) {
            courses.push(courseData);
          }
          
          // Rate limiting between courses
          await this.sleep(this.config.rateLimit);
        } catch (error) {
          this.logger.error(`Failed to scrape course ${link}:`, error.message);
        }
      }

      this.logger.info(`Successfully scraped ${courses.length} courses from MIT`);
      return courses;
    } catch (error) {
      this.logger.error('MIT scraping failed:', error);
      throw error;
    }
  }

  /**
   * Extract course links from search/listing page
   */
  async extractCourseLinks() {
    const links = await this.extractMultiple('.course-item a.course-link', elements => {
      return elements.map(el => el.href);
    });

    // Fallback to alternative selector if needed
    if (links.length === 0) {
      return await this.extractMultiple('a[href*="/courses/"]', elements => {
        return [...new Set(elements.map(el => el.href))].slice(0, 50);
      });
    }

    return links;
  }

  /**
   * Scrape individual course details
   */
  async scrapeCourseDetails(url) {
    try {
      await this.navigateWithRetry(url);

      const courseData = {
        source: 'MIT OpenCourseWare',
        sourceUrl: url,
        university: 'Massachusetts Institute of Technology',
        scrapedAt: new Date(),
        rawData: {}
      };

      // Extract course title
      courseData.title = await this.extractText('h1.course-title, h1', 'Untitled Course');

      // Extract course code
      courseData.courseCode = await this.extractText('.course-number, .course-code', '');

      // Extract description
      courseData.description = await this.extractText('.course-description, .description, p', '');
      
      // Extract full text content for better description
      const content = await this.page.content();
      const $ = cheerio.load(content);
      
      // Get course info sections
      const sections = {};
      $('.course-info-section, .section').each((i, elem) => {
        const title = $(elem).find('h2, h3').first().text().trim();
        const text = $(elem).text().trim();
        if (title) {
          sections[title] = text;
        }
      });

      // Extract instructors
      courseData.instructors = await this.extractMultiple('.instructor-name, .faculty-name', elements => {
        return elements.map(el => el.textContent.trim());
      });

      if (courseData.instructors.length === 0) {
        const instructorText = sections['Instructor'] || sections['Instructors'] || '';
        courseData.instructors = instructorText.split(',').map(s => s.trim()).filter(s => s);
      }

      // Extract syllabus/topics
      courseData.syllabus = await this.extractMultiple('.topic-list li, .syllabus-item', elements => {
        return elements.map(el => el.textContent.trim());
      });

      // Extract prerequisites
      const prereqText = sections['Prerequisites'] || await this.extractText('.prerequisites', '');
      courseData.prerequisites = prereqText || 'None listed';

      // Extract level
      if (sections['Level']) {
        if (sections['Level'].toLowerCase().includes('undergraduate')) {
          courseData.level = 'Undergraduate';
        } else if (sections['Level'].toLowerCase().includes('graduate')) {
          courseData.level = 'Graduate';
        }
      }

      // Extract department/category
      courseData.department = await this.extractText('.department, .subject-area', '');

      // MIT OCW is free
      courseData.pricing = {
        type: 'free',
        amount: 0,
        currency: 'USD'
      };

      // Delivery mode - MIT OCW is online
      courseData.deliveryMode = 'online';
      courseData.format = 'self-paced';

      // Extract materials/resources
      courseData.materials = await this.extractMultiple('.download-link, .resource-link', elements => {
        return elements.map(el => ({
          title: el.textContent.trim(),
          url: el.href
        }));
      });

      // Extract video lectures info
      const hasVideoLectures = await this.page.$('.video-lectures, [data-type="video"]');
      courseData.hasVideoLectures = !!hasVideoLectures;

      // Store raw sections data
      courseData.rawData.sections = sections;

      // MIT OCW courses are always active and free
      courseData.isActive = true;
      courseData.certification = {
        available: false,
        type: 'none'
      };

      // Set metadata
      courseData.language = 'English';
      courseData.accessibility = {
        closedCaptions: courseData.hasVideoLectures,
        transcripts: true
      };

      this.logger.info(`Successfully scraped: ${courseData.title}`);
      return courseData;

    } catch (error) {
      this.logger.error(`Failed to scrape course details from ${url}:`, error.message);
      return null;
    }
  }
}

module.exports = MITScraper;
