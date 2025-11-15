# Web Scraping Architecture - Tasks 11-15

## Task 11: Web Scraping Architecture ✅

### Base Scraper Class
**File:** `backend/scrapers/BaseScraper.js`

**Features:**
- Puppeteer-based browser automation
- Robots.txt compliance checking
- Rate limiting (configurable delay between requests)
- Retry logic with exponential backoff (3 attempts by default)
- Error handling and logging (Winston)
- Resource blocking (images, fonts, CSS) for performance
- Screenshot capability for debugging
- Dynamic content loading support (scrolling, waiting)
- User agent configuration

**Key Methods:**
- `initialize()` - Launch browser and configure
- `checkRobotsTxt(url)` - Verify scraping permissions
- `navigateWithRetry(url)` - Navigate with automatic retries
- `extractData()` - Generic data extraction with error handling
- `scrollToBottom()` - Load dynamic content
- `cleanup()` - Close browser and free resources

---

## Task 12: University Website Scrapers ✅

### MIT OpenCourseWare Scraper
**File:** `backend/scrapers/university/MITScraper.js`

**Extracts:**
- Course title, code, description
- Instructors and department
- Syllabus topics
- Prerequisites
- Course level (Undergraduate/Graduate)
- Video lecture availability
- Course materials/resources

**Source:** https://ocw.mit.edu/search/

### Stanford Online Scraper
**File:** `backend/scrapers/university/StanfordScraper.js`

**Extracts:**
- Course information and pricing
- Duration and format (self-paced/instructor-led)
- Start/end dates
- Level and certification info
- Instructors

**Source:** https://online.stanford.edu/courses

### Harvard Online Learning Scraper
**File:** `backend/scrapers/university/HarvardScraper.js`

**Extracts:**
- Course details and syllabus
- Pricing and tuition
- Effort/time commitment
- Certificate information
- Instructor profiles

**Source:** https://pll.harvard.edu/catalog

### University of Witwatersrand (Wits) Scraper
**File:** `backend/scrapers/university/WitsScraper.js`

**Extracts:**
- Course/Programme title, code, description
- Faculty and department
- Duration (years/semesters)
- Qualification type and level
- Entry requirements and minimum APS
- Fees (ZAR converted to USD)
- Modules and credits
- Delivery mode (in-person/hybrid/online)

**Source:** https://www.wits.ac.za/course-finder/

### University of Pretoria (UP) Scraper
**File:** `backend/scrapers/university/UPScraper.js`

**Extracts:**
- Programme title, code, description
- Faculty and qualification details
- Duration and study mode
- Admission requirements and minimum APS
- Tuition fees (ZAR to USD conversion)
- Curriculum modules
- Application deadlines

**Source:** https://www.up.ac.za/programmes

### University of Johannesburg (UJ) Scraper
**File:** `backend/scrapers/university/UJScraper.js`

**Extracts:**
- Programme title and SAQA ID
- Faculty and NQF level (South African Qualifications Framework)
- Qualification type and duration
- Minimum requirements and APS score
- Mode of delivery
- Fees, modules, and credits
- Career opportunities
- Language of instruction

**Source:** https://www.uj.ac.za/faculties/

### University of Cape Town (UCT) Scraper
**File:** `backend/scrapers/university/UCTScraper.js`

**Extracts:**
- Programme name, code, description
- Faculty and degree type
- Duration and study mode
- Entry requirements, APS, and NBT requirements
- Tuition fees (ZAR to USD)
- Curriculum and credits
- Application deadlines
- Research focus areas
- Contact information

**Source:** https://www.uct.ac.za/study/programmes

---

## Task 13: Course Platform Scrapers ✅

### Coursera Scraper
**File:** `backend/scrapers/platform/CourseraScraper.js`

**Extracts:**
- Course title, provider/university
- Rating and enrollment count
- Skills and syllabus modules
- Pricing (freemium/subscription model)
- Languages and accessibility features
- Certificate availability

**Features:**
- Search-based scraping with queries
- Handles audit vs paid tracks
- 3-second rate limiting (stricter)

### edX Scraper
**File:** `backend/scrapers/platform/EdXScraper.js`

**Extracts:**
- Course and institution info
- Duration and effort requirements
- Audit vs verified tracks
- Prerequisites
- Start dates

**Features:**
- Free audit track detection
- Verified certificate pricing

### FutureLearn Scraper
**File:** `backend/scrapers/platform/FutureLearnScraper.js`

**Extracts:**
- Course details and partner info
- Weekly study hours
- Freemium pricing model
- Learning outcomes
- Cohort-based format

**Features:**
- GBP/USD currency handling
- Cohort vs self-paced detection

---

## Task 14: Scraping Job Queue System ✅

### Bull Queue Implementation
**File:** `backend/services/ScrapingQueue.js`

**Features:**
- Redis-backed job queue (Bull.js)
- Automatic retry with exponential backoff
- Job prioritization
- Job staggering to avoid rate limits
- Event logging (completed, failed, stalled)
- Queue statistics tracking

**API Functions:**
- `addScrapingJob(type, config)` - Add single job
- `scheduleUniversityScrapers()` - Schedule all university scrapers
- `schedulePlatformScrapers(queries)` - Schedule platform scrapers with search queries
- `getQueueStats()` - Get queue metrics
- `pauseQueue()` / `resumeQueue()` - Control queue processing
- `retryFailedJobs()` - Retry all failed jobs
- `cleanOldJobs()` - Remove jobs older than 7 days

### Cron Jobs
**File:** `backend/services/CronJobs.js`

**Schedules:**
- **Daily (2 AM):** University scrapers (MIT, Stanford, Harvard)
- **Every 12 hours:** Platform scrapers (5 search queries)
- **Weekly (Saturday 3 AM):** Comprehensive scraping (15 search queries across all platforms)

### Admin API Endpoints
**File:** `backend/routes/scraping.js`

**Endpoints:**
- `POST /api/scraping/trigger/:type` - Manual job trigger
- `POST /api/scraping/schedule/universities` - Schedule all university scrapers
- `POST /api/scraping/schedule/platforms` - Schedule platform scrapers
- `GET /api/scraping/stats` - Queue statistics
- `GET /api/scraping/jobs` - List recent jobs (filter by status)
- `POST /api/scraping/pause` - Pause queue
- `POST /api/scraping/resume` - Resume queue
- `POST /api/scraping/retry-failed` - Retry failed jobs
- `POST /api/scraping/clean` - Clean old jobs
- `DELETE /api/scraping/jobs/:jobId` - Remove specific job

---

## Task 15: Data Validation & Normalization Pipeline ✅

### Data Processor
**File:** `backend/services/DataProcessor.js`

**Validation:**
- Required fields checking (title, university, description)
- Description minimum length (20 characters)
- Data integrity validation

**Normalization:**

1. **Text Cleaning:**
   - HTML stripping with Cheerio
   - Whitespace normalization
   - Non-ASCII character removal

2. **Pricing Normalization:**
   - Currency conversion to USD
   - Support for: USD, GBP, EUR, CAD, AUD
   - Pricing type detection (free, paid, freemium, subscription)
   - Billing period handling

3. **Duration Normalization:**
   - Convert all durations to weeks
   - Handle units: weeks, months, hours, days
   - Store both normalized and display formats

4. **Level Normalization:**
   - Map variations to: Beginner, Intermediate, Advanced, Graduate, Undergraduate

5. **Language Normalization:**
   - Standardize language names (English, Spanish, French, etc.)
   - Handle language codes (en, es, fr, etc.)

6. **Delivery Mode Normalization:**
   - Map to: online, in-person, hybrid

7. **Date Parsing:**
   - Safe date parsing with error handling
   - Invalid date detection

**Database Integration:**
- `findOrCreateUniversity()` - Auto-create universities from scraped data
- `processInstructors()` - Create instructor records
- `findOrCreateCategory()` - Auto-create categories
- `saveOrUpdateCourse()` - Upsert courses based on sourceUrl

**Deduplication:**
- Uses `sourceUrl` as unique identifier
- Updates existing courses instead of creating duplicates

---

## Installation & Setup

### Packages Installed:
```bash
puppeteer         # Browser automation
axios             # HTTP requests
robots-parser     # Robots.txt compliance
cheerio           # HTML parsing
bull              # Job queue
winston           # Logging
redis             # Queue backend
node-cron         # Job scheduling
```

### Configuration:
- Redis connection configurable via `.env`
- Logging directories created: `backend/logs/` and `backend/logs/screenshots/`
- Scraping routes registered at `/api/scraping`

### Environment Variables:
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

## Usage Examples

### Manual Trigger:
```bash
# Trigger MIT scraper
POST /api/scraping/trigger/mit

# Trigger Coursera with custom query
POST /api/scraping/trigger/coursera
Body: { "config": { "searchQuery": "machine learning" } }
```

### Schedule All Scrapers:
```bash
POST /api/scraping/schedule/universities
POST /api/scraping/schedule/platforms
```

### Monitor Queue:
```bash
GET /api/scraping/stats
GET /api/scraping/jobs?status=active&limit=10
```

---

## Data Flow

1. **Scraper** → Extracts raw course data from website
2. **Queue** → Jobs processed asynchronously with retries
3. **DataProcessor** → Validates and normalizes data
4. **Database** → Courses saved/updated with relationships
5. **Logging** → All operations logged to files

---

## Features Summary

✅ **Task 11:** Robust scraping architecture with rate limiting, retries, robots.txt compliance  
✅ **Task 12:** 7 university scrapers (MIT, Stanford, Harvard, Wits, UP, UJ, UCT)  
✅ **Task 13:** 3 platform scrapers (Coursera, edX, FutureLearn)  
✅ **Task 14:** Bull queue system with cron jobs and admin API  
✅ **Task 15:** Comprehensive data validation and normalization pipeline

**Total Files Created:** 16 files
**Total API Endpoints:** 10 scraping management endpoints
**Total Scrapers:** 10 (7 universities + 3 platforms)
- **US Universities:** MIT, Stanford, Harvard
- **South African Universities:** Wits, UP, UJ, UCT
- **Course Platforms:** Coursera, edX, FutureLearn
