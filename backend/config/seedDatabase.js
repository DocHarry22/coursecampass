const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('../models/Category');
const Region = require('../models/Region');
const connectDB = require('../config/database');

// Sample Categories
const categories = [
  // Top-level categories
  { name: 'Computer Science', slug: 'computer-science', level: 0, iconName: 'code' },
  { name: 'Business & Management', slug: 'business-management', level: 0, iconName: 'business' },
  { name: 'Engineering', slug: 'engineering', level: 0, iconName: 'engineering' },
  { name: 'Health & Medicine', slug: 'health-medicine', level: 0, iconName: 'health' },
  { name: 'Arts & Humanities', slug: 'arts-humanities', level: 0, iconName: 'palette' },
  { name: 'Natural Sciences', slug: 'natural-sciences', level: 0, iconName: 'science' },
  { name: 'Social Sciences', slug: 'social-sciences', level: 0, iconName: 'people' },
  { name: 'Mathematics & Statistics', slug: 'mathematics-statistics', level: 0, iconName: 'calculate' }
];

const subcategories = {
  'Computer Science': [
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Web Development',
    'Mobile Development',
    'Cybersecurity',
    'Cloud Computing',
    'Database Management',
    'Software Engineering',
    'Game Development'
  ],
  'Business & Management': [
    'Marketing',
    'Finance',
    'Entrepreneurship',
    'Project Management',
    'Human Resources',
    'Business Analytics',
    'Supply Chain Management',
    'Leadership',
    'Strategy',
    'Operations Management'
  ],
  'Engineering': [
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Industrial Engineering',
    'Environmental Engineering',
    'Biomedical Engineering'
  ],
  'Health & Medicine': [
    'Nursing',
    'Public Health',
    'Medicine',
    'Pharmacy',
    'Nutrition',
    'Mental Health',
    'Healthcare Management',
    'Clinical Research'
  ],
  'Arts & Humanities': [
    'Literature',
    'History',
    'Philosophy',
    'Music',
    'Visual Arts',
    'Theater',
    'Creative Writing',
    'Film & Media Studies'
  ],
  'Natural Sciences': [
    'Biology',
    'Chemistry',
    'Physics',
    'Environmental Science',
    'Geology',
    'Astronomy',
    'Biotechnology'
  ],
  'Social Sciences': [
    'Psychology',
    'Sociology',
    'Political Science',
    'Economics',
    'Anthropology',
    'Education',
    'Communication Studies',
    'Geography'
  ],
  'Mathematics & Statistics': [
    'Pure Mathematics',
    'Applied Mathematics',
    'Statistics',
    'Data Analytics',
    'Actuarial Science',
    'Mathematical Modeling'
  ]
};

// Sample Regions
const continents = [
  { name: 'North America', slug: 'north-america', regionType: 'continent' },
  { name: 'South America', slug: 'south-america', regionType: 'continent' },
  { name: 'Europe', slug: 'europe', regionType: 'continent' },
  { name: 'Asia', slug: 'asia', regionType: 'continent' },
  { name: 'Africa', slug: 'africa', regionType: 'continent' },
  { name: 'Oceania', slug: 'oceania', regionType: 'continent' }
];

const countries = {
  'North America': [
    { name: 'United States', countryCode: 'US' },
    { name: 'Canada', countryCode: 'CA' },
    { name: 'Mexico', countryCode: 'MX' }
  ],
  'Europe': [
    { name: 'United Kingdom', countryCode: 'GB' },
    { name: 'Germany', countryCode: 'DE' },
    { name: 'France', countryCode: 'FR' },
    { name: 'Spain', countryCode: 'ES' },
    { name: 'Italy', countryCode: 'IT' },
    { name: 'Netherlands', countryCode: 'NL' },
    { name: 'Switzerland', countryCode: 'CH' },
    { name: 'Sweden', countryCode: 'SE' }
  ],
  'Asia': [
    { name: 'China', countryCode: 'CN' },
    { name: 'Japan', countryCode: 'JP' },
    { name: 'India', countryCode: 'IN' },
    { name: 'South Korea', countryCode: 'KR' },
    { name: 'Singapore', countryCode: 'SG' },
    { name: 'United Arab Emirates', countryCode: 'AE' }
  ],
  'Oceania': [
    { name: 'Australia', countryCode: 'AU' },
    { name: 'New Zealand', countryCode: 'NZ' }
  ]
};

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('📝 Clearing existing categories and regions...');
    await Category.deleteMany({});
    await Region.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Insert top-level categories
    console.log('📚 Inserting categories...');
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✅ Inserted ${insertedCategories.length} top-level categories`);

    // Insert subcategories
    let subcategoryCount = 0;
    for (const [parentName, subs] of Object.entries(subcategories)) {
      const parent = insertedCategories.find(cat => cat.name === parentName);
      if (parent) {
        const subsWithParent = subs.map(name => ({
          name,
          slug: name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
          parent: parent._id,
          level: 1
        }));
        const inserted = await Category.insertMany(subsWithParent);
        subcategoryCount += inserted.length;
      }
    }
    console.log(`✅ Inserted ${subcategoryCount} subcategories\n`);

    // Insert continents
    console.log('🌍 Inserting regions...');
    const insertedContinents = await Region.insertMany(continents);
    console.log(`✅ Inserted ${insertedContinents.length} continents`);

    // Insert countries
    let countryCount = 0;
    for (const [continentName, countryList] of Object.entries(countries)) {
      const continent = insertedContinents.find(c => c.name === continentName);
      if (continent) {
        const countriesWithParent = countryList.map(({ name, countryCode }) => ({
          name,
          slug: name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
          regionType: 'country',
          parent: continent._id,
          countryCode
        }));
        const inserted = await Region.insertMany(countriesWithParent);
        countryCount += inserted.length;
      }
    }
    console.log(`✅ Inserted ${countryCount} countries\n`);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- ${insertedCategories.length} top-level categories`);
    console.log(`- ${subcategoryCount} subcategories`);
    console.log(`- ${insertedContinents.length} continents`);
    console.log(`- ${countryCount} countries`);
    console.log(`- Total: ${insertedCategories.length + subcategoryCount + insertedContinents.length + countryCount} documents\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
