# CourseCompass Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configurations:
- Set `MONGODB_URI` to your MongoDB connection string
- For local development: `mongodb://localhost:27017/coursecampass`
- For MongoDB Atlas: Get connection string from your cluster

### 3. Start MongoDB
Make sure MongoDB is running locally or use MongoDB Atlas cloud service.

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:**
- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Get your connection string
- Update MONGODB_URI in .env

### 4. Run the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Courses

#### Get All Courses
```
GET /api/courses
Query Parameters:
- page (default: 1)
- limit (default: 20)
- sort (default: -createdAt)
- university (MongoDB ObjectId)
- category (MongoDB ObjectId)
- deliveryMode (online|in-person|hybrid|blended)
- priceType (free|paid|freemium|subscription)
- minPrice (number)
- maxPrice (number)
- level (undergraduate|graduate|professional|certificate)
- language (string)
- search (text search query)
- isFeatured (true|false)
- minRating (number 0-5)
```

#### Get Single Course
```
GET /api/courses/:id
Parameters:
- id: Course MongoDB ObjectId or slug
```

#### Create Course
```
POST /api/courses
Body: Course object (see model)
```

#### Update Course
```
PUT /api/courses/:id
Body: Updated course fields
```

#### Delete Course
```
DELETE /api/courses/:id
```

### Universities

#### Get All Universities
```
GET /api/universities
Query Parameters:
- page (default: 1)
- limit (default: 20)
- sort (default: name)
- country (string)
- institutionType (public|private|online-only|hybrid)
- isPartner (true|false)
- isVerified (true|false)
- search (text search query)
```

#### Get Single University
```
GET /api/universities/:id
Parameters:
- id: University MongoDB ObjectId or slug
```

#### Get University Courses
```
GET /api/universities/:id/courses
Query Parameters: Same as Get All Courses
```

#### Create University
```
POST /api/universities
Body: University object (see model)
```

#### Update University
```
PUT /api/universities/:id
Body: Updated university fields
```

#### Delete University
```
DELETE /api/universities/:id
```

### Advanced Search

#### Search Courses with Multiple Filters
```
POST /api/search
Body:
{
  "page": 1,
  "limit": 20,
  "sort": "-createdAt",
  "universities": ["id1", "id2"],
  "categories": ["id1", "id2"],
  "regions": ["id1", "id2"],
  "deliveryModes": ["online", "hybrid"],
  "priceTypes": ["free", "paid"],
  "minPrice": 0,
  "maxPrice": 1000,
  "levels": ["undergraduate"],
  "languages": ["English"],
  "minRating": 4.0,
  "minDuration": 4,
  "maxDuration": 12,
  "durationUnit": "weeks",
  "startDateFrom": "2025-01-01",
  "startDateTo": "2025-12-31",
  "minCredits": 3,
  "maxCredits": 6,
  "accessibilityFeatures": ["captions"],
  "certificationTypes": ["certificate"],
  "isFeatured": true,
  "isSelfPaced": false,
  "searchQuery": "data science"
}
```

## Data Models

### Course Model
See: `backend/models/Course.js`

Key fields:
- title, slug, descriptions
- university (ref), category (ref), instructors
- pricing (type, amount, currency)
- duration, schedule
- enrollment capacity
- ratings, stats
- certification details
- accessibility features

### University Model
See: `backend/models/University.js`

Key fields:
- name, slug, logo
- location details
- institution type
- accreditation, rankings
- partner status

### Instructor Model
See: `backend/models/Instructor.js`

### Category Model
See: `backend/models/Category.js`
Hierarchical structure for fields of study

### Region Model
See: `backend/models/Region.js`
Hierarchical: continent → country → state → city

### CourseReview Model
See: `backend/models/CourseReview.js`

## Database Schema

All models use MongoDB with Mongoose ODM. The schema includes:
- Proper indexes for performance
- Virtual fields for relationships
- Auto-generated slugs
- Timestamps (createdAt, updatedAt)
- Data validation

## Next Steps

1. Set up authentication middleware
2. Implement web scraping system
3. Add category and region seed data
4. Create admin panel endpoints
5. Implement caching with Redis
6. Add rate limiting
7. Set up file upload for images
8. Integrate email notifications
