const puppeteer = require('puppeteer');
const robotsParser = require('robots-parser');
const axios = require('axios');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/scraper-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/scraper-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class BaseScraper {
  constructor(config = {}) {
    this.config = {
      headless: config.headless !== false,
      timeout: config.timeout || 30000,
      userAgent: config.userAgent || 'CourseCompass Bot/1.0 (Educational Course Aggregator)',
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 2000,
      rateLimit: config.rateLimit || 1000, // ms between requests
      respectRobotsTxt: config.respectRobotsTxt !== false,
      viewport: config.viewport || { width: 1920, height: 1080 }
    };

    this.browser = null;
    this.page = null;
    this.robotsCache = new Map();
    this.lastRequestTime = 0;
    this.logger = logger;
  }

  /**
   * Initialize browser instance
   */
  async initialize() {
    try {
      this.logger.info('Initializing browser...');
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(this.config.userAgent);
      await this.page.setViewport(this.config.viewport);

      // Block unnecessary resources to speed up scraping
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      this.logger.info('Browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Check robots.txt compliance
   */
  async checkRobotsTxt(url) {
    if (!this.config.respectRobotsTxt) {
      return true;
    }

    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      // Check cache first
      if (this.robotsCache.has(robotsUrl)) {
        const robots = this.robotsCache.get(robotsUrl);
        return robots.isAllowed(url, this.config.userAgent);
      }

      // Fetch robots.txt
      const response = await axios.get(robotsUrl, { 
        timeout: 5000,
        validateStatus: (status) => status < 500 
      });

      const robots = robotsParser(robotsUrl, response.data);
      this.robotsCache.set(robotsUrl, robots);

      const allowed = robots.isAllowed(url, this.config.userAgent);
      
      if (!allowed) {
        this.logger.warn(`Access to ${url} disallowed by robots.txt`);
      }

      return allowed;
    } catch (error) {
      // If robots.txt doesn't exist or fails, allow scraping
      this.logger.warn(`Could not fetch robots.txt for ${url}, proceeding anyway`);
      return true;
    }
  }

  /**
   * Rate limiting - delay between requests
   */
  async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.config.rateLimit) {
      const delay = this.config.rateLimit - timeSinceLastRequest;
      this.logger.debug(`Rate limiting: waiting ${delay}ms`);
      await this.sleep(delay);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Navigate to URL with retry logic
   */
  async navigateWithRetry(url, attempt = 1) {
    try {
      // Check robots.txt
      const allowed = await this.checkRobotsTxt(url);
      if (!allowed) {
        throw new Error('Access disallowed by robots.txt');
      }

      // Apply rate limiting
      await this.applyRateLimit();

      this.logger.info(`Navigating to ${url} (attempt ${attempt}/${this.config.retryAttempts})`);

      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout
      });

      return true;
    } catch (error) {
      this.logger.error(`Navigation failed (attempt ${attempt}): ${error.message}`);

      if (attempt < this.config.retryAttempts) {
        this.logger.info(`Retrying in ${this.config.retryDelay}ms...`);
        await this.sleep(this.config.retryDelay);
        return this.navigateWithRetry(url, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Extract data with error handling
   */
  async extractData(selector, extractFn, defaultValue = null) {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      return await extractFn();
    } catch (error) {
      this.logger.warn(`Failed to extract data from ${selector}: ${error.message}`);
      return defaultValue;
    }
  }

  /**
   * Extract text content from selector
   */
  async extractText(selector, defaultValue = '') {
    return this.extractData(
      selector,
      async () => {
        return await this.page.$eval(selector, el => el.textContent.trim());
      },
      defaultValue
    );
  }

  /**
   * Extract attribute from selector
   */
  async extractAttribute(selector, attribute, defaultValue = '') {
    return this.extractData(
      selector,
      async () => {
        return await this.page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
      },
      defaultValue
    );
  }

  /**
   * Extract multiple elements
   */
  async extractMultiple(selector, extractFn) {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      return await this.page.$$eval(selector, extractFn);
    } catch (error) {
      this.logger.warn(`Failed to extract multiple elements from ${selector}: ${error.message}`);
      return [];
    }
  }

  /**
   * Scroll to load dynamic content
   */
  async scrollToBottom(maxScrolls = 10) {
    let scrolls = 0;
    let lastHeight = 0;

    while (scrolls < maxScrolls) {
      const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);
      
      if (currentHeight === lastHeight) {
        break;
      }

      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.sleep(1000);
      
      lastHeight = currentHeight;
      scrolls++;
    }

    this.logger.debug(`Scrolled ${scrolls} times`);
  }

  /**
   * Wait for dynamic content to load
   */
  async waitForDynamicContent(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      this.logger.warn(`Dynamic content ${selector} did not load: ${error.message}`);
      return false;
    }
  }

  /**
   * Take screenshot for debugging
   */
  async screenshot(filename) {
    try {
      await this.page.screenshot({ 
        path: `logs/screenshots/${filename}`,
        fullPage: true 
      });
      this.logger.info(`Screenshot saved: ${filename}`);
    } catch (error) {
      this.logger.error(`Failed to take screenshot: ${error.message}`);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      this.logger.info('Browser closed successfully');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }

  /**
   * Main scrape method - to be overridden by subclasses
   */
  async scrape(url) {
    throw new Error('scrape() method must be implemented by subclass');
  }

  /**
   * Run scraper with full lifecycle
   */
  async run(url) {
    try {
      await this.initialize();
      const data = await this.scrape(url);
      return data;
    } catch (error) {
      this.logger.error(`Scraper failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

module.exports = BaseScraper;
