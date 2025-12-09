const Course = require('../models/Course');
const courses = require('../data/courses');

const seedCourses = async () => {
  try {
    // Delete all existing courses
    await Course.deleteMany({});
    console.log('🗑️  Deleted all existing courses');

    // Transform the course data to match our model
    const transformedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      modules: course.modules,
      duration: course.duration,
      image: course.image,
      category: course.category,
      progress: 0, // Default progress
      score: 0, // Default score
      lastAccessed: 'Not started',
      status: course.status || 'active'
    }));

    // Insert the courses
    await Course.insertMany(transformedCourses);
    console.log(`✅ Seeded ${transformedCourses.length} courses`);
    
    return transformedCourses;
  } catch (error) {
    console.error('Error seeding courses:', error);
    throw error;
  }
};

module.exports = seedCourses;
