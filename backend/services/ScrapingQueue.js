const Bull = require('bull');
const winston = require('winston');

// Import scrapers
const MITScraper = require('../scrapers/university/MITScraper');
const StanfordScraper = require('../scrapers/university/StanfordScraper');
const HarvardScraper = require('../scrapers/university/HarvardScraper');
const WitsScraper = require('../scrapers/university/WitsScraper');
const UPScraper = require('../scrapers/university/UPScraper');
const UJScraper = require('../scrapers/university/UJScraper');
const UCTScraper = require('../scrapers/university/UCTScraper');
const CourseraScraper = require('../scrapers/platform/CourseraScraper');
const EdXScraper = require('../scrapers/platform/EdXScraper');
const FutureLearnScraper = require('../scrapers/platform/FutureLearnScraper');

// Import data processor
const DataProcessor = require('./DataProcessor');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/scraping-queue-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/scraping-queue.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Create Bull queue for scraping jobs
const scrapingQueue = new Bull('course-scraping', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500 // Keep last 500 failed jobs
  }
});

// Process scraping jobs
scrapingQueue.process(async (job) => {
  const { scraperType, config } = job.data;
  
  logger.info(`Processing scraping job: ${scraperType}`, { jobId: job.id });
  
  try {
    let scraper;
    let scrapedData;

    // Initialize appropriate scraper
    switch (scraperType) {
      case 'mit':
        scraper = new MITScraper(config);
        scrapedData = await scraper.run(config.url);
        break;
      
      case 'stanford':
        scraper = new StanfordScraper(config);
        scrapedData = await scraper.run(config.url);
        break;
      
      case 'harvard':
        scraper = new HarvardScraper(config);
        scrapedData = await scraper.run(config.url);
        break;
      
      case 'wits':
        scraper = new WitsScraper(config);
        scrapedData = await scraper.run(config.url);
        break;
      
      case 'up':
        scraper = new UPScraper(config);
        scrapedData = await scraper.run(config.url);
        break;
      
      case 'uj':
        scraper = new UJScraper(config);
        scrapedData = await scraper.run(config.url);
        break;
      
      case 'uct':
        scraper = new UCTScraper(config);
        scrapedData = await scraper.run(config.url);
        break;
      
      case 'coursera':
        scraper = new CourseraScraper(config);
        scrapedData = await scraper.run(config.searchQuery);
        break;
      
      case 'edx':
        scraper = new EdXScraper(config);
        scrapedData = await scraper.run(config.searchQuery);
        break;
      
      case 'futurelearn':
        scraper = new FutureLearnScraper(config);
        scrapedData = await scraper.run(config.searchQuery);
        break;
      
      default:
        throw new Error(`Unknown scraper type: ${scraperType}`);
    }

    // Process and validate scraped data
    const processor = new DataProcessor();
    const processedData = await processor.processBatch(scrapedData);

    logger.info(`Successfully scraped and processed ${processedData.length} courses from ${scraperType}`);

    return {
      success: true,
      scraperType,
      coursesScraped: scrapedData.length,
      coursesProcessed: processedData.length,
      processedData
    };

  } catch (error) {
    logger.error(`Scraping job failed for ${scraperType}:`, error);
    throw error;
  }
});

// Queue event listeners
scrapingQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed successfully`, {
    scraperType: job.data.scraperType,
    coursesProcessed: result.coursesProcessed
  });
});

scrapingQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed`, {
    scraperType: job.data.scraperType,
    error: err.message,
    attempts: job.attemptsMade
  });
});

scrapingQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`, {
    scraperType: job.data.scraperType
  });
});

// Helper functions to add jobs

/**
 * Add a single scraping job
 */
async function addScrapingJob(scraperType, config = {}) {
  const job = await scrapingQueue.add({
    scraperType,
    config
  }, {
    priority: config.priority || 10,
    delay: config.delay || 0
  });

  logger.info(`Added scraping job for ${scraperType}`, { jobId: job.id });
  return job;
}

/**
 * Schedule all university scrapers
 */
async function scheduleUniversityScrapers() {
  const universities = [
    // US Universities
    { type: 'mit', url: 'https://ocw.mit.edu/search/' },
    { type: 'stanford', url: 'https://online.stanford.edu/courses' },
    { type: 'harvard', url: 'https://pll.harvard.edu/catalog' },
    // South African Universities
    { type: 'wits', url: 'https://www.wits.ac.za/course-finder/' },
    { type: 'up', url: 'https://www.up.ac.za/programmes' },
    { type: 'uj', url: 'https://www.uj.ac.za/faculties/' },
    { type: 'uct', url: 'https://www.uct.ac.za/study/programmes' }
  ];

  const jobs = [];
  
  for (const [index, uni] of universities.entries()) {
    const job = await addScrapingJob(uni.type, {
      url: uni.url,
      delay: index * 10000, // Stagger jobs by 10 seconds
      priority: 5
    });
    jobs.push(job);
  }

  return jobs;
}

/**
 * Schedule all platform scrapers
 */
async function schedulePlatformScrapers(searchQueries = ['computer science', 'data science', 'business']) {
  const platforms = ['coursera', 'edx', 'futurelearn'];
  const jobs = [];

  let delay = 0;
  
  for (const platform of platforms) {
    for (const query of searchQueries) {
      const job = await addScrapingJob(platform, {
        searchQuery: query,
        delay: delay,
        priority: 8
      });
      jobs.push(job);
      delay += 15000; // Stagger by 15 seconds
    }
  }

  return jobs;
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    scrapingQueue.getWaitingCount(),
    scrapingQueue.getActiveCount(),
    scrapingQueue.getCompletedCount(),
    scrapingQueue.getFailedCount(),
    scrapingQueue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

/**
 * Clean old jobs
 */
async function cleanOldJobs() {
  await scrapingQueue.clean(7 * 24 * 60 * 60 * 1000); // Clean jobs older than 7 days
  logger.info('Cleaned old jobs from queue');
}

/**
 * Pause queue
 */
async function pauseQueue() {
  await scrapingQueue.pause();
  logger.info('Queue paused');
}

/**
 * Resume queue
 */
async function resumeQueue() {
  await scrapingQueue.resume();
  logger.info('Queue resumed');
}

/**
 * Get failed jobs for retry
 */
async function retryFailedJobs() {
  const failed = await scrapingQueue.getFailed();
  logger.info(`Retrying ${failed.length} failed jobs`);
  
  for (const job of failed) {
    await job.retry();
  }
  
  return failed.length;
}

module.exports = {
  scrapingQueue,
  addScrapingJob,
  scheduleUniversityScrapers,
  schedulePlatformScrapers,
  getQueueStats,
  cleanOldJobs,
  pauseQueue,
  resumeQueue,
  retryFailedJobs
};
