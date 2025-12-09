// Migration script to ensure progress persistence
const mongoose = require('mongoose');
const CourseProgress = require('../models/CourseProgress');
require('dotenv').config({ path: '../../.env' });

async function migrateProgress() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrilearn-cacao', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔗 Connected to MongoDB for migration');
    
    // Find any existing progress records that might need updating
    const existingProgress = await CourseProgress.find({});
    console.log(`Found ${existingProgress.length} existing progress records`);
    
    // Update any progress records that might be missing critical fields
    for (const progress of existingProgress) {
      const updates = {};
      
      // Ensure essential fields exist
      if (!progress.completedLessons) {
        updates.completedLessons = [];
      }
      if (!progress.quizResults) {
        updates.quizResults = [];
      }
      if (progress.overallProgress === undefined) {
        updates.overallProgress = 0;
      }
      if (progress.isCompleted === undefined) {
        updates.isCompleted = false;
      }
      if (progress.certificateEarned === undefined) {
        updates.certificateEarned = false;
      }
      if (progress.totalTimeSpent === undefined) {
        updates.totalTimeSpent = 0;
      }
      if (progress.averageScore === undefined) {
        updates.averageScore = 0;
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await CourseProgress.updateOne(
          { _id: progress._id },
          { $set: updates }
        );
        console.log(`Updated progress record for user: ${progress.userId}, course: ${progress.courseId}`);
      }
    }
    
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the migration
migrateProgress();
