// Performance optimization configuration and utilities

const compression = require('compression');
const helmet = require('helmet');

/**
 * Configure caching headers
 */
const setCacheHeaders = (req, res, next) => {
  // Cache static assets for 1 year
  if (req.url.match(/\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Cache API responses for 5 minutes
  else if (req.url.startsWith('/api/courses') || req.url.startsWith('/api/universities')) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  // No cache for user-specific data
  else if (req.url.includes('/profile') || req.url.includes('/enrollments')) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  }
  
  next();
};

/**
 * Lazy loading configuration for React
 */
const lazyLoadConfig = {
  routes: [
    'Dashboard',
    'Courses',
    'CourseDetail',
    'Profile',
    'Favorites',
    'Enrollments',
    'Admin',
    'Partner',
    'Analytics',
    'Payments',
    'Certificates'
  ],
  chunkSize: 'medium' // small, medium, large
};

/**
 * Database indexing recommendations
 */
const databaseIndexes = {
  users: [
    { field: 'email', unique: true },
    { field: 'createdAt', descending: true },
    { field: 'lastLogin', descending: true },
    { field: 'role' }
  ],
  courses: [
    { field: 'title', text: true },
    { field: 'category' },
    { field: 'difficulty' },
    { field: 'averageRating', descending: true },
    { field: 'createdAt', descending: true },
    { field: 'university' },
    { field: 'status' }
  ],
  enrollments: [
    { field: 'student' },
    { field: 'course' },
    { field: 'status' },
    { field: 'enrollmentDate', descending: true },
    { compound: ['student', 'course'], unique: true }
  ],
  reviews: [
    { field: 'course' },
    { field: 'user' },
    { field: 'status' },
    { field: 'createdAt', descending: true }
  ],
  payments: [
    { field: 'user' },
    { field: 'course' },
    { field: 'status' },
    { field: 'transactionId', unique: true },
    { field: 'createdAt', descending: true }
  ],
  certificates: [
    { field: 'student' },
    { field: 'course' },
    { field: 'certificateNumber', unique: true },
    { field: 'verificationCode', unique: true }
  ]
};

/**
 * SEO Meta Tags configuration
 */
const seoConfig = {
  defaultMeta: {
    title: 'CourseCompass - Online Learning Platform',
    description: 'Discover and enroll in courses from top universities worldwide. Build your skills with CourseCompass.',
    keywords: 'online courses, learning platform, education, skill development, certifications',
    ogImage: '/assets/og-image.jpg',
    twitterCard: 'summary_large_image'
  },
  routeMetadata: {
    '/courses': {
      title: 'Browse Courses - CourseCompass',
      description: 'Explore thousands of courses across various categories and skill levels'
    },
    '/dashboard': {
      title: 'My Dashboard - CourseCompass',
      description: 'Track your learning progress and manage your enrollments'
    },
    '/certificates': {
      title: 'My Certificates - CourseCompass',
      description: 'View and share your course completion certificates'
    }
  }
};

/**
 * Code splitting configuration
 */
const codeSplittingConfig = {
  vendors: [
    'react',
    'react-dom',
    'react-router-dom',
    '@mui/material',
    'recharts'
  ],
  splitChunks: {
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all'
      },
      common: {
        minChunks: 2,
        priority: -10,
        reuseExistingChunk: true
      }
    }
  }
};

/**
 * Image optimization settings
 */
const imageOptimization = {
  formats: ['webp', 'jpg', 'png'],
  sizes: [320, 640, 960, 1280, 1920],
  quality: {
    webp: 80,
    jpg: 85,
    png: 90
  },
  lazyLoad: true,
  placeholder: 'blur'
};

/**
 * API Response compression
 */
const compressionConfig = {
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
};

/**
 * Security headers configuration
 */
const securityConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'https://api.coursecompass.com']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

/**
 * Performance monitoring utilities
 */
const performanceMonitoring = {
  trackPageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`Page load time: ${pageLoadTime}ms`);
      return pageLoadTime;
    }
    return 0;
  },
  
  trackAPICall: async (apiCall, endpoint) => {
    const startTime = Date.now();
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      console.log(`API ${endpoint} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`API ${endpoint} failed after ${duration}ms`);
      throw error;
    }
  }
};

/**
 * Prefetching and preloading strategies
 */
const resourceHints = {
  preconnect: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.coursecompass.com'
  ],
  prefetch: [
    '/assets/common-icons.svg',
    '/assets/placeholder.jpg'
  ],
  preload: [
    { href: '/assets/main-logo.svg', as: 'image' },
    { href: '/fonts/main-font.woff2', as: 'font', type: 'font/woff2', crossorigin: true }
  ]
};

/**
 * Bundle size optimization tips
 */
const optimizationTips = {
  removeUnusedDependencies: [
    'lodash - use lodash-es or specific imports',
    'moment - use date-fns or dayjs instead',
    'Use tree-shaking compatible imports'
  ],
  codeMinification: {
    terser: true,
    removeConsole: true,
    dropDebugger: true
  },
  cssOptimization: {
    purgeCSS: true,
    minify: true,
    extractCritical: true
  }
};

module.exports = {
  setCacheHeaders,
  lazyLoadConfig,
  databaseIndexes,
  seoConfig,
  codeSplittingConfig,
  imageOptimization,
  compressionConfig,
  securityConfig,
  performanceMonitoring,
  resourceHints,
  optimizationTips,
  
  // Express middleware setup
  setupPerformanceMiddleware: (app) => {
    // Compression
    app.use(compression(compressionConfig));
    
    // Security headers
    app.use(helmet(securityConfig));
    
    // Caching
    app.use(setCacheHeaders);
    
    // Performance monitoring
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
          console.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
        }
      });
      next();
    });
  }
};
