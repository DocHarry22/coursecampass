const cron = require('node-cron');
const {
  scheduleUniversityScrapers,
  schedulePlatformScrapers
} = require('../services/ScrapingQueue');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/cron.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Initialize cron jobs for scraping
 */
function initializeCronJobs() {
  logger.info('Initializing scraping cron jobs...');

  // Run university scrapers daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Running daily university scraping job...');
      await scheduleUniversityScrapers();
      logger.info('Daily university scraping job completed');
    } catch (error) {
      logger.error('Error in daily university scraping job:', error);
    }
  });

  // Run platform scrapers every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    try {
      logger.info('Running bi-daily platform scraping job...');
      const queries = ['computer science', 'data science', 'business', 'engineering', 'arts'];
      await schedulePlatformScrapers(queries);
      logger.info('Bi-daily platform scraping job completed');
    } catch (error) {
      logger.error('Error in bi-daily platform scraping job:', error);
    }
  });

  // Run comprehensive scraping on weekends (Saturday 3 AM)
  cron.schedule('0 3 * * 6', async () => {
    try {
      logger.info('Running weekly comprehensive scraping job...');
      
      // Schedule all university scrapers
      await scheduleUniversityScrapers();
      
      // Schedule platform scrapers with more search queries
      const comprehensiveQueries = [
        'computer science',
        'data science',
        'business',
        'engineering',
        'mathematics',
        'physics',
        'biology',
        'chemistry',
        'economics',
        'psychology',
        'arts',
        'humanities',
        'medicine',
        'law',
        'education'
      ];
      await schedulePlatformScrapers(comprehensiveQueries);
      
      logger.info('Weekly comprehensive scraping job completed');
    } catch (error) {
      logger.error('Error in weekly comprehensive scraping job:', error);
    }
  });

  logger.info('Cron jobs initialized successfully');
  logger.info('- Daily university scraping: 2:00 AM');
  logger.info('- Bi-daily platform scraping: Every 12 hours');
  logger.info('- Weekly comprehensive scraping: Saturday 3:00 AM');
}

module.exports = { initializeCronJobs };
