const express = require('express');
const router = express.Router();
const {
  addScrapingJob,
  scheduleUniversityScrapers,
  schedulePlatformScrapers,
  getQueueStats,
  cleanOldJobs,
  pauseQueue,
  resumeQueue,
  retryFailedJobs,
  scrapingQueue
} = require('../services/ScrapingQueue');

// @route   POST /api/scraping/trigger/:type
// @desc    Manually trigger a scraping job
// @access  Admin (TODO: Add auth middleware)
router.post('/trigger/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { config = {} } = req.body;

    const validTypes = ['mit', 'stanford', 'harvard', 'wits', 'up', 'uj', 'uct', 'coursera', 'edx', 'futurelearn'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid scraper type. Valid types: ${validTypes.join(', ')}`
      });
    }

    const job = await addScrapingJob(type, config);

    res.json({
      success: true,
      message: `Scraping job added for ${type}`,
      jobId: job.id,
      job: {
        id: job.id,
        data: job.data,
        opts: job.opts
      }
    });
  } catch (error) {
    console.error('Error triggering scraping job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger scraping job',
      error: error.message
    });
  }
});

// @route   POST /api/scraping/schedule/universities
// @desc    Schedule all university scrapers
// @access  Admin
router.post('/schedule/universities', async (req, res) => {
  try {
    const jobs = await scheduleUniversityScrapers();

    res.json({
      success: true,
      message: 'University scraping jobs scheduled',
      jobCount: jobs.length,
      jobs: jobs.map(j => ({ id: j.id, type: j.data.scraperType }))
    });
  } catch (error) {
    console.error('Error scheduling university scrapers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule university scrapers',
      error: error.message
    });
  }
});

// @route   POST /api/scraping/schedule/platforms
// @desc    Schedule all platform scrapers
// @access  Admin
router.post('/schedule/platforms', async (req, res) => {
  try {
    const { queries = ['computer science', 'data science', 'business'] } = req.body;
    const jobs = await schedulePlatformScrapers(queries);

    res.json({
      success: true,
      message: 'Platform scraping jobs scheduled',
      jobCount: jobs.length,
      queries,
      jobs: jobs.map(j => ({ id: j.id, type: j.data.scraperType }))
    });
  } catch (error) {
    console.error('Error scheduling platform scrapers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule platform scrapers',
      error: error.message
    });
  }
});

// @route   GET /api/scraping/stats
// @desc    Get queue statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const stats = await getQueueStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue stats',
      error: error.message
    });
  }
});

// @route   GET /api/scraping/jobs
// @desc    Get recent jobs
// @access  Admin
router.get('/jobs', async (req, res) => {
  try {
    const { status = 'all', limit = 50 } = req.query;
    
    let jobs = [];
    
    switch (status) {
      case 'active':
        jobs = await scrapingQueue.getActive();
        break;
      case 'waiting':
        jobs = await scrapingQueue.getWaiting();
        break;
      case 'completed':
        jobs = await scrapingQueue.getCompleted();
        break;
      case 'failed':
        jobs = await scrapingQueue.getFailed();
        break;
      default:
        const [active, waiting, completed, failed] = await Promise.all([
          scrapingQueue.getActive(),
          scrapingQueue.getWaiting(),
          scrapingQueue.getCompleted(0, 20),
          scrapingQueue.getFailed(0, 20)
        ]);
        jobs = [...active, ...waiting, ...completed, ...failed];
    }

    jobs = jobs.slice(0, parseInt(limit));

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue
    }));

    res.json({
      success: true,
      count: formattedJobs.length,
      jobs: formattedJobs
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs',
      error: error.message
    });
  }
});

// @route   POST /api/scraping/pause
// @desc    Pause queue processing
// @access  Admin
router.post('/pause', async (req, res) => {
  try {
    await pauseQueue();

    res.json({
      success: true,
      message: 'Queue paused'
    });
  } catch (error) {
    console.error('Error pausing queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause queue',
      error: error.message
    });
  }
});

// @route   POST /api/scraping/resume
// @desc    Resume queue processing
// @access  Admin
router.post('/resume', async (req, res) => {
  try {
    await resumeQueue();

    res.json({
      success: true,
      message: 'Queue resumed'
    });
  } catch (error) {
    console.error('Error resuming queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume queue',
      error: error.message
    });
  }
});

// @route   POST /api/scraping/retry-failed
// @desc    Retry all failed jobs
// @access  Admin
router.post('/retry-failed', async (req, res) => {
  try {
    const count = await retryFailedJobs();

    res.json({
      success: true,
      message: `Retrying ${count} failed jobs`,
      count
    });
  } catch (error) {
    console.error('Error retrying failed jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry jobs',
      error: error.message
    });
  }
});

// @route   POST /api/scraping/clean
// @desc    Clean old completed jobs
// @access  Admin
router.post('/clean', async (req, res) => {
  try {
    await cleanOldJobs();

    res.json({
      success: true,
      message: 'Old jobs cleaned'
    });
  } catch (error) {
    console.error('Error cleaning jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean jobs',
      error: error.message
    });
  }
});

// @route   DELETE /api/scraping/jobs/:jobId
// @desc    Remove a specific job
// @access  Admin
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await scrapingQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await job.remove();

    res.json({
      success: true,
      message: 'Job removed',
      jobId
    });
  } catch (error) {
    console.error('Error removing job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove job',
      error: error.message
    });
  }
});

module.exports = router;
