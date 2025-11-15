const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

// Performance middleware (if available)
try {
  const { setupPerformanceMiddleware } = require('./config/performance');
  setupPerformanceMiddleware(app);
} catch (err) {
  console.log('Performance middleware not configured');
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('CourseCompass backend running...');
});

// Link APS calculator route
const calculateRoute = require('./routes/apcalculator');
app.use('/api/calculate', calculateRoute);

// Link GPA route
const gpaRoute = require('./routes/gpa');
app.use('/api/gpa', gpaRoute);

// Link Course routes
const courseRoutes = require('./routes/courses');
app.use('/api/courses', courseRoutes);

// Link University routes
const universityRoutes = require('./routes/universities');
app.use('/api/universities', universityRoutes);

// Link Search routes
const searchRoutes = require('./routes/search');
app.use('/api/search', searchRoutes);

// Link Category routes
const categoryRoutes = require('./routes/categories');
app.use('/api/categories', categoryRoutes);

// Link Region routes
const regionRoutes = require('./routes/regions');
app.use('/api/regions', regionRoutes);

// Link Autocomplete routes
const autocompleteRoutes = require('./routes/autocomplete');
app.use('/api/autocomplete', autocompleteRoutes);

// Link Scraping routes
const scrapingRoutes = require('./routes/scraping');
app.use('/api/scraping', scrapingRoutes);

// Link Partner API routes
const partnerRoutes = require('./routes/partner');
app.use('/api/partner', partnerRoutes);

// Link Admin routes (for API key management)
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Link Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Link Enrollment routes
const enrollmentRoutes = require('./routes/enrollments');
app.use('/api/enrollments', enrollmentRoutes);

// Link Favorites routes
const favoriteRoutes = require('./routes/favorites');
app.use('/api/favorites', favoriteRoutes);

// Link Review routes
const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);

// Link Recommendation routes
const recommendationRoutes = require('./routes/recommendations');
app.use('/api/recommendations', recommendationRoutes);

// Link Notification routes
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Link Admin routes
const adminRoutesNew = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutesNew);

// Link Partner Portal routes
const partnerPortalRoutes = require('./routes/partnerPortal');
app.use('/api/partner-portal', partnerPortalRoutes);

// Link Analytics routes
const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);

// Link Payment routes
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// Link Certificate routes
const certificateRoutes = require('./routes/certificates');
app.use('/api/certificates', certificateRoutes);

// Link Advanced Search routes
const advancedSearchRoutes = require('./routes/advancedSearch');
app.use('/api/advanced-search', advancedSearchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
