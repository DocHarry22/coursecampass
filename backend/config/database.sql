-- CourseCompass Database Schema
-- PostgreSQL Schema Design

-- ============================================
-- CORE TABLES
-- ============================================

-- Universities/Institutions Table
CREATE TABLE universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    website_url VARCHAR(500),
    
    -- Location
    country VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    
    -- Institution Details
    institution_type VARCHAR(50), -- 'public', 'private', 'online-only'
    accreditation TEXT[], -- Array of accreditation bodies
    rankings JSONB, -- Flexible JSON for different ranking systems
    
    -- Contact
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Partner Details
    is_partner BOOLEAN DEFAULT FALSE,
    partner_tier VARCHAR(20), -- 'free', 'premium', 'featured'
    is_verified BOOLEAN DEFAULT FALSE,
    api_endpoint VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instructors Table
CREATE TABLE instructors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    bio TEXT,
    profile_image_url VARCHAR(500),
    title VARCHAR(100), -- 'Professor', 'Dr.', 'Lecturer'
    department VARCHAR(150),
    university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL,
    
    -- Social/Professional Links
    linkedin_url VARCHAR(500),
    research_gate_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories (Fields of Study) - Hierarchical
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 0, -- 0: top-level, 1: subcategory, 2: sub-subcategory
    icon_name VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Regions (Hierarchical: Continent > Country > State/Province > City)
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    region_type VARCHAR(20) NOT NULL, -- 'continent', 'country', 'state', 'city'
    parent_id INTEGER REFERENCES regions(id) ON DELETE CASCADE,
    country_code VARCHAR(5), -- ISO country code
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    
    -- Basic Info
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    short_description TEXT,
    full_description TEXT,
    syllabus TEXT,
    
    -- Relationships
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    primary_instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Course Details
    course_code VARCHAR(50), -- e.g., 'CS101'
    level VARCHAR(50), -- 'undergraduate', 'graduate', 'professional', 'certificate'
    delivery_mode VARCHAR(20) NOT NULL, -- 'online', 'in-person', 'hybrid', 'blended'
    language VARCHAR(50) DEFAULT 'English',
    
    -- Pricing
    price_type VARCHAR(20) NOT NULL, -- 'free', 'paid', 'freemium', 'subscription'
    price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    original_price DECIMAL(10, 2), -- For showing discounts
    
    -- Duration & Schedule
    duration_value INTEGER, -- numeric value
    duration_unit VARCHAR(20), -- 'days', 'weeks', 'months', 'years'
    is_self_paced BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    enrollment_deadline DATE,
    
    -- Capacity & Enrollment
    max_capacity INTEGER,
    current_enrollment INTEGER DEFAULT 0,
    enrollment_status VARCHAR(20) DEFAULT 'open', -- 'open', 'waitlist', 'closed'
    
    -- Academic Details
    credits DECIMAL(4, 2), -- Credit hours
    prerequisites TEXT,
    learning_outcomes TEXT[],
    assessment_methods TEXT[],
    
    -- Certification
    certification_type VARCHAR(50), -- 'certificate', 'diploma', 'degree', 'microcredential', 'audit'
    certification_accredited BOOLEAN DEFAULT FALSE,
    
    -- Accessibility
    accessibility_features TEXT[], -- 'captions', 'transcripts', 'sign-language', 'screen-reader'
    
    -- Media
    thumbnail_url VARCHAR(500),
    video_preview_url VARCHAR(500),
    
    -- External Links
    course_url VARCHAR(500) NOT NULL,
    application_url VARCHAR(500),
    
    -- Ratings & Stats
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_enrollments INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    
    -- Data Source
    data_source VARCHAR(50), -- 'scraped', 'api', 'manual', 'partner'
    last_scraped_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course-Instructor Junction (for multiple instructors)
CREATE TABLE course_instructors (
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'instructor', -- 'lead', 'instructor', 'teaching-assistant'
    
    PRIMARY KEY (course_id, instructor_id)
);

-- Reviews & Ratings
CREATE TABLE course_reviews (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER, -- Will be linked to users table when auth is implemented
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(200),
    review_text TEXT,
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    
    -- Verification
    is_verified_enrollment BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USER-RELATED TABLES (for future implementation)
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url VARCHAR(500),
    
    -- Preferences
    preferred_fields JSONB, -- Array of category IDs
    preferred_regions JSONB, -- Array of region IDs
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Favorites/Wishlist
CREATE TABLE user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, course_id)
);

-- User Course Applications Tracking
CREATE TABLE user_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'applied', -- 'applied', 'accepted', 'rejected', 'pending', 'waitlisted'
    application_date DATE DEFAULT CURRENT_DATE,
    deadline DATE,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PARTNER & ADMIN TABLES
-- ============================================

-- Partner API Keys
CREATE TABLE partner_api_keys (
    id SERIAL PRIMARY KEY,
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret_hash VARCHAR(255) NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scraping Logs
CREATE TABLE scraping_logs (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100), -- 'MIT', 'Coursera', etc.
    source_url VARCHAR(500),
    
    status VARCHAR(20), -- 'success', 'failed', 'partial'
    courses_found INTEGER DEFAULT 0,
    courses_added INTEGER DEFAULT 0,
    courses_updated INTEGER DEFAULT 0,
    
    error_message TEXT,
    
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- ============================================
-- ANALYTICS TABLES
-- ============================================

-- Course Views/Clicks Tracking
CREATE TABLE course_analytics (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    
    event_type VARCHAR(20), -- 'view', 'click', 'apply', 'favorite'
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    
    -- Request metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Universities
CREATE INDEX idx_universities_slug ON universities(slug);
CREATE INDEX idx_universities_country ON universities(country);
CREATE INDEX idx_universities_partner ON universities(is_partner, partner_tier);
CREATE INDEX idx_universities_verified ON universities(is_verified);

-- Instructors
CREATE INDEX idx_instructors_university ON instructors(university_id);
CREATE INDEX idx_instructors_name ON instructors(last_name, first_name);

-- Categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);

-- Regions
CREATE INDEX idx_regions_type ON regions(region_type);
CREATE INDEX idx_regions_parent ON regions(parent_id);
CREATE INDEX idx_regions_slug ON regions(slug);

-- Courses (Most Important)
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_university ON courses(university_id);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_instructor ON courses(primary_instructor_id);
CREATE INDEX idx_courses_delivery ON courses(delivery_mode);
CREATE INDEX idx_courses_price_type ON courses(price_type);
CREATE INDEX idx_courses_price ON courses(price);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_status ON courses(is_active, verification_status);
CREATE INDEX idx_courses_rating ON courses(average_rating);
CREATE INDEX idx_courses_dates ON courses(start_date, end_date);
CREATE INDEX idx_courses_featured ON courses(is_featured);
CREATE INDEX idx_courses_language ON courses(language);

-- Full-text search indexes
CREATE INDEX idx_courses_title_search ON courses USING GIN(to_tsvector('english', title));
CREATE INDEX idx_courses_description_search ON courses USING GIN(to_tsvector('english', full_description));

-- Reviews
CREATE INDEX idx_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_reviews_user ON course_reviews(user_id);
CREATE INDEX idx_reviews_rating ON course_reviews(rating);

-- User tables
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_favorites_course ON user_favorites(course_id);

-- Analytics
CREATE INDEX idx_analytics_course ON course_analytics(course_id);
CREATE INDEX idx_analytics_university ON course_analytics(university_id);
CREATE INDEX idx_analytics_event ON course_analytics(event_type, created_at);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON course_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA FOR REGIONS (Common structure)
-- ============================================

-- Continents
INSERT INTO regions (name, slug, region_type) VALUES
('North America', 'north-america', 'continent'),
('Europe', 'europe', 'continent'),
('Asia', 'asia', 'continent'),
('South America', 'south-america', 'continent'),
('Africa', 'africa', 'continent'),
('Oceania', 'oceania', 'continent');

-- Sample Countries (North America)
INSERT INTO regions (name, slug, region_type, parent_id, country_code) VALUES
('United States', 'united-states', 'country', 1, 'US'),
('Canada', 'canada', 'country', 1, 'CA'),
('Mexico', 'mexico', 'country', 1, 'MX');

-- ============================================
-- SAMPLE CATEGORIES (Fields of Study)
-- ============================================

-- Top-level categories
INSERT INTO categories (name, slug, level) VALUES
('Computer Science', 'computer-science', 0),
('Business & Management', 'business-management', 0),
('Engineering', 'engineering', 0),
('Health & Medicine', 'health-medicine', 0),
('Arts & Humanities', 'arts-humanities', 0),
('Natural Sciences', 'natural-sciences', 0),
('Social Sciences', 'social-sciences', 0),
('Mathematics & Statistics', 'mathematics-statistics', 0);

-- Computer Science subcategories
INSERT INTO categories (name, slug, parent_id, level) VALUES
('Artificial Intelligence', 'artificial-intelligence', 1, 1),
('Web Development', 'web-development', 1, 1),
('Data Science', 'data-science', 1, 1),
('Cybersecurity', 'cybersecurity', 1, 1),
('Mobile Development', 'mobile-development', 1, 1);

-- Business subcategories
INSERT INTO categories (name, slug, parent_id, level) VALUES
('Marketing', 'marketing', 2, 1),
('Finance', 'finance', 2, 1),
('Entrepreneurship', 'entrepreneurship', 2, 1),
('Project Management', 'project-management', 2, 1);
