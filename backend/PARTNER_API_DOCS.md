# Partner API Documentation

## Overview
The Partner API allows universities to programmatically submit, update, and manage their courses on CourseCompass.

## Authentication
All API requests require authentication using API key and secret.

### Headers Required
```
X-API-Key: pk_your_api_key_here
X-API-Secret: sk_your_api_secret_here
```

### Obtaining API Credentials
Contact CourseCompass administrators to request API access for your university.

## Rate Limits
- Default: 1,000 requests/hour
- Daily: 10,000 requests/day
- Custom limits available for premium partners

## Endpoints

### 1. Create Course
**POST** `/api/partner/courses`

Submit a new course for approval.

**Required Permission:** `create`

**Request Body:**
```json
{
  "title": "Introduction to Machine Learning",
  "description": "Comprehensive ML course covering supervised and unsupervised learning",
  "courseCode": "CS101",
  "categories": ["65f8a1b2c3d4e5f6a7b8c9d0"],
  "instructors": ["65f8a1b2c3d4e5f6a7b8c9d1"],
  "level": "Intermediate",
  "duration": {
    "value": 12,
    "unit": "weeks"
  },
  "deliveryMode": "Online",
  "language": "English",
  "pricing": {
    "type": "paid",
    "currency": "USD",
    "amount": 299
  },
  "schedule": {
    "startDate": "2024-09-01T00:00:00Z",
    "endDate": "2024-11-24T00:00:00Z",
    "isFlexible": false
  },
  "enrollment": {
    "maxCapacity": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course created successfully. Awaiting approval.",
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d2",
    "title": "Introduction to Machine Learning",
    "verificationStatus": "pending",
    ...
  }
}
```

### 2. Get Courses
**GET** `/api/partner/courses`

Retrieve all courses submitted by your university.

**Required Permission:** `read`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `status` (optional): Filter by verification status (approved/pending/rejected)

**Response:**
```json
{
  "success": true,
  "data": [...courses],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 3. Update Course
**PUT** `/api/partner/courses/:id`

Update an existing course. Resets verification status to pending.

**Required Permission:** `update`

**Request Body:** Same as Create Course

**Response:**
```json
{
  "success": true,
  "message": "Course updated successfully. Awaiting approval.",
  "data": {...updated course}
}
```

### 4. Delete Course
**DELETE** `/api/partner/courses/:id`

Delete a course from your university's catalog.

**Required Permission:** `delete`

**Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

### 5. Bulk Upload
**POST** `/api/partner/courses/bulk`

Upload multiple courses in a single request (max 100).

**Required Permission:** `create`

**Request Body:**
```json
{
  "courses": [
    {
      "title": "Course 1",
      ...
    },
    {
      "title": "Course 2",
      ...
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk upload completed. 95 courses created, 5 failed.",
  "results": {
    "successful": [...],
    "failed": [...]
  }
}
```

### 6. Get Analytics
**GET** `/api/partner/analytics`

Retrieve performance analytics for your university's courses.

**Required Permission:** `analytics`

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCourses": 120,
      "approvedCourses": 105,
      "pendingCourses": 10,
      "rejectedCourses": 5,
      "totalViews": 45632,
      "totalEnrolled": 8923
    },
    "topCourses": [...],
    "university": {...}
  }
}
```

### 7. Get API Usage
**GET** `/api/partner/api-usage`

Check your API usage and rate limits.

**Required Permission:** `read`

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "lastUsed": "2024-01-15T14:30:00Z",
      "totalRequests": 5432,
      "requestsToday": 234,
      "resetDate": "2024-01-15T00:00:00Z"
    },
    "rateLimit": {
      "requestsPerHour": 1000,
      "requestsPerDay": 10000
    },
    "permissions": ["read", "create", "update", "delete", "analytics"],
    "university": "Massachusetts Institute of Technology"
  }
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Missing API credentials. Include X-API-Key and X-API-Secret headers."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "API key has been deactivated"
}
```

### 429 Rate Limit Exceeded
```json
{
  "success": false,
  "message": "Rate limit exceeded. Try again tomorrow.",
  "rateLimit": {
    "requestsPerHour": 1000,
    "requestsPerDay": 10000
  }
}
```

## Best Practices

1. **Store Credentials Securely**: Never commit API keys to version control
2. **Handle Rate Limits**: Implement exponential backoff for rate limit errors
3. **Validate Data**: Ensure all required fields are present before submission
4. **Monitor Usage**: Regularly check `/api/partner/api-usage` to track consumption
5. **Bulk Operations**: Use `/api/partner/courses/bulk` for uploading multiple courses
6. **Error Handling**: Always check the `success` field in responses

## Verification Workflow

1. Partner submits course via API
2. Course status set to `pending`
3. Admin reviews and approves/rejects
4. Approved courses appear on CourseCompass
5. Rejected courses returned with feedback

## Support

For API support, contact: api-support@coursecompass.edu
