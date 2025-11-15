# API Testing Guide

## Test the Backend API

The backend server is running on `http://localhost:5000`

### Method 1: Browser
Open your browser and visit:
- http://localhost:5000/
- http://localhost:5000/api/courses
- http://localhost:5000/api/universities

### Method 2: PowerShell
```powershell
# Test basic endpoint
Invoke-RestMethod -Uri "http://localhost:5000/" -Method GET

# Get all courses (currently empty, but API works)
Invoke-RestMethod -Uri "http://localhost:5000/api/courses" -Method GET

# Get all universities (currently empty, but API works)
Invoke-RestMethod -Uri "http://localhost:5000/api/universities" -Method GET
```

### Method 3: Postman or Thunder Client
1. Install Postman or Thunder Client (VS Code extension)
2. Import the endpoints from backend/README.md
3. Test all endpoints

### Create Test Data

You can create a test university and course using PowerShell:

```powershell
# Create a test university
$university = @{
    name = "Massachusetts Institute of Technology"
    slug = "mit"
    description = "A world-leading research university"
    websiteUrl = "https://www.mit.edu"
    location = @{
        country = "United States"
        city = "Cambridge"
        stateProvince = "Massachusetts"
    }
    institutionType = "private"
    isVerified = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/universities" -Method POST -Body $university -ContentType "application/json"
```

## Server Commands

### Start Development Server
```bash
cd backend
npm run dev
```

### Seed Database
```bash
cd backend
npm run seed
```

### Check Server Status
The server should show:
```
Server running on port 5000
MongoDB Connected: localhost
```

## Expected API Responses

### GET /api/courses (empty database)
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 0,
    "totalItems": 0,
    "itemsPerPage": 20
  }
}
```

### POST /api/search
Returns courses matching filters with statistics.

## Troubleshooting

### MongoDB not connected?
1. Check if MongoDB is running: `mongod`
2. Check connection string in `.env`
3. For MongoDB Atlas, use cloud connection string

### Port already in use?
- Change PORT in `.env` file
- Or stop other process on port 5000

### Missing dependencies?
```bash
npm install
```
