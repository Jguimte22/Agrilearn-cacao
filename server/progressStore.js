// Database-backed progress store for persistence
const mongoose = require('mongoose');
const CourseProgress = require('./models/CourseProgress');

// Helper functions to manage progress using MongoDB
const getProgress = async (userId, courseId = null) => {
  try {
    if (courseId) {
      // Get specific course progress from database
      let progress = await CourseProgress.findOne({ userId, courseId });

      // If no progress exists, create default structure
      if (!progress) {
        return {
          courseId,
          completedLessons: [],
          overallProgress: 0,
          isCompleted: false,
          certificateEarned: false,
          totalTimeSpent: 0,
          quizResults: [],
          averageScore: 0
        };
      }

      // Convert Mongoose document to plain object and ensure completedLessons has the right format
      return {
        courseId: progress.courseId,
        completedLessons: progress.completedLessons || [],
        overallProgress: progress.overallProgress || 0,
        isCompleted: progress.isCompleted || false,
        certificateEarned: progress.certificateEarned || false,
        totalTimeSpent: progress.totalTimeSpent || 0,
        quizResults: progress.quizResults || [],
        averageScore: progress.averageScore || 0
      };
    } else {
      // Get all user progress from database
      const allProgress = await CourseProgress.find({ userId });
      
      if (allProgress.length === 0) {
        return {
          userId,
          courses: {}
        };
      }
      
      // Convert database results to expected format
      const userProgress = {
        userId,
        courses: {}
      };
      
      allProgress.forEach(progress => {
        userProgress.courses[progress.courseId] = {
          courseId: progress.courseId,
          completedLessons: progress.completedLessons || [],
          overallProgress: progress.overallProgress || 0,
          isCompleted: progress.isCompleted || false,
          certificateEarned: progress.certificateEarned || false,
          totalTimeSpent: progress.totalTimeSpent || 0,
          quizResults: progress.quizResults || [],
          averageScore: progress.averageScore || 0,
          courseJustCompleted: false
        };
      });
      
      return userProgress;
    }
  } catch (error) {
    console.error('Error getting progress from database:', error);
    // Fallback to empty structure if database fails
    return courseId ? {
      courseId,
      completedLessons: [],
      overallProgress: 0,
      isCompleted: false,
      certificateEarned: false
    } : {
      userId,
      courses: {}
    };
  }
};

const saveProgress = async (userId, progress) => {
  try {
    // Save all course progress to database
    for (const [courseId, courseProgress] of Object.entries(progress.courses || {})) {
      await CourseProgress.findOneAndUpdate(
        { userId, courseId },
        {
          $set: {
            completedLessons: courseProgress.completedLessons || [],
            overallProgress: courseProgress.overallProgress || 0,
            isCompleted: courseProgress.isCompleted || false,
            certificateEarned: courseProgress.certificateEarned || false,
            totalTimeSpent: courseProgress.totalTimeSpent || 0,
            quizResults: courseProgress.quizResults || [],
            averageScore: courseProgress.averageScore || 0,
            lastAccessed: new Date()
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log('Progress saved to database:', { userId, courses: Object.keys(progress.courses || {}) });
  } catch (error) {
    console.error('Error saving progress to database:', error);
  }
};

const completeLesson = async (userId, courseId, lessonId, lessonTitle) => {
  console.log(' completeLesson called:', { userId, courseId, lessonId, lessonTitle });
  
  try {
    const userProgress = await getProgress(userId);
    
    // Get or create course progress
    if (!userProgress.courses[courseId]) {
      userProgress.courses[courseId] = {
        courseId,
        completedLessons: [],
        overallProgress: 0,
        isCompleted: false,
        certificateEarned: false,
        courseJustCompleted: false,
        totalTimeSpent: 0,
        quizResults: [],
        averageScore: 0
      };
    }
    
    const courseProgress = userProgress.courses[courseId];
    
    // Check if lesson is already completed
    const isAlreadyCompleted = courseProgress.completedLessons.some(
      lesson => (lesson.lessonId || lesson) === lessonId
    );
    
    if (!isAlreadyCompleted) {
      // Add lesson completion
      courseProgress.completedLessons.push({
        lessonId,
        title: lessonTitle || `Lesson ${lessonId}`,
        completedAt: new Date(),
        timeSpent: 30
      });
      
      console.log(' Lesson added to completed list:', {
        courseId,
        lessonId,
        totalCompleted: courseProgress.completedLessons.length,
        completedLessons: courseProgress.completedLessons.map(l => l.lessonId || l)
      });
    } else {
      console.log(' Lesson already completed, skipping:', { courseId, lessonId });
    }
    
    // Dynamic lesson counts based on actual course structure
    const courseLessonCounts = {
      'cacao-basics': 4,           // intro-cacao, cacao-history, cacao-varieties, growing-conditions
      'planting-techniques': 4,    // soil-requirements, shade-management, nursery-care, planting-methods
      'harvest-processing': 11,     // 11 lessons from harvest-timing to common-defects
      'pest-disease': 15,          // 15 lessons from pest-identification to safety-measures
      'cloning-techniques': 6,     // why-clone-cacao, cloning-basics, cloning-methods-overview, grafting-techniques, nursery-establishment, acclimatization
      'care-management': 9,         // irrigation-methods, water-conservation, drainage-systems, pruning-techniques, canopy-management, pruning-schedule, essential-nutrients, fertilization, soil-health
      'gap-practices': 3,           // gap-principles, benefits-gap, regulatory-framework
      'cacao-history': 4            // ancient-origins, cultural-significance, global-spread, modern-industry
    };
    
    const totalLessons = courseLessonCounts[courseId] || 4;
    const completedCount = courseProgress.completedLessons.length;
    
    // Calculate progress percentage correctly
    let calculatedProgress;
    if (courseId === 'gap-practices') {
      // GAP has 3 lessons total
      if (completedCount >= 3) {
        calculatedProgress = 100;
      } else {
        calculatedProgress = Math.round((completedCount / 3) * 100);
      }
    } else {
      // For all other courses, use the actual lesson count
      calculatedProgress = Math.round((completedCount / totalLessons) * 100);
    }
    
    // Force update the progress - completely overwrite old value
    courseProgress.overallProgress = calculatedProgress;
    
    console.log(' PROGRESS UPDATED IN STORE:', {
      courseId,
      newProgress: courseProgress.overallProgress,
      calculatedProgress,
      completedCount,
      totalLessons
    });
    
    // Mark course as completed if all lessons are done
    if (courseProgress.overallProgress >= 100) {
      courseProgress.isCompleted = true;
      courseProgress.certificateEarned = true;
      
      // Return course completion flag
      courseProgress.courseJustCompleted = true;
    } else {
      courseProgress.isCompleted = false;
      courseProgress.courseJustCompleted = false;
    }
    
    // Update last accessed time
    courseProgress.lastUpdated = new Date();
    
    // Save progress to database
    await saveProgress(userId, userProgress);
    
    console.log(' FINAL PROGRESS BEING RETURNED:', {
      courseId,
      overallProgress: courseProgress.overallProgress,
      isCompleted: courseProgress.isCompleted,
      courseJustCompleted: courseProgress.courseJustCompleted,
      completedLessons: courseProgress.completedLessons.length
    });
    
    return courseProgress;
  } catch (error) {
    console.error('Error in completeLesson:', error);
    // Return fallback structure
    return {
      courseId,
      completedLessons: [],
      overallProgress: 0,
      isCompleted: false,
      certificateEarned: false,
      courseJustCompleted: false
    };
  }
};

// Function to recalculate existing progress with updated lesson counts
const recalculateProgress = async (userId) => {
  try {
    const userProgress = await getProgress(userId);
    
    // Updated lesson counts based on actual course structure
    const courseLessonCounts = {
      'cacao-basics': 4,           // intro-cacao, cacao-history, cacao-varieties, growing-conditions
      'planting-techniques': 4,    // soil-requirements, shade-management, nursery-care, planting-methods
      'harvest-processing': 11,     // 11 lessons from harvest-timing to common-defects
      'pest-disease': 15,          // 15 lessons from pest-identification to safety-measures
      'cloning-techniques': 6,     // why-clone-cacao, cloning-basics, cloning-methods-overview, grafting-techniques, nursery-establishment, acclimatization
      'care-management': 9,         // irrigation-methods, water-conservation, drainage-systems, pruning-techniques, canopy-management, pruning-schedule, essential-nutrients, fertilization, soil-health
      'gap-practices': 3,           // gap-principles, benefits-gap, regulatory-framework
      'cacao-history': 4            // ancient-origins, cultural-significance, global-spread, modern-industry
    };
    
    // Recalculate progress for each course
    for (const [courseId, courseProgress] of Object.entries(userProgress.courses || {})) {
      const totalLessons = courseLessonCounts[courseId] || 4;
      const completedCount = courseProgress.completedLessons.length;
      
      // Special handling for gap-practices to force correct calculation
      let calculatedProgress;
      if (courseId === 'gap-practices') {
        // GAP has 3 lessons total - if all 3 are completed, it should be 100%
        if (completedCount >= 3) {
          calculatedProgress = 100;
        } else {
          calculatedProgress = Math.round((completedCount / 3) * 100);
        }
      } else {
        calculatedProgress = Math.round((completedCount / totalLessons) * 100);
      }
      
      // Update progress percentage
      courseProgress.overallProgress = calculatedProgress;
      
      // Update completion status
      if (courseProgress.overallProgress >= 100) {
        courseProgress.isCompleted = true;
        courseProgress.certificateEarned = true;
        courseProgress.courseJustCompleted = true; // Trigger notifications
      } else {
        courseProgress.isCompleted = false;
        courseProgress.courseJustCompleted = false;
      }
      
      console.log(`Recalculated progress for ${courseId}:`, {
        completedLessons: completedCount,
        totalLessons,
        overallProgress: courseProgress.overallProgress,
        isCompleted: courseProgress.isCompleted
      });
    }
    
    await saveProgress(userId, userProgress);
    return userProgress;
  } catch (error) {
    console.error('Error in recalculateProgress:', error);
    return {
      userId,
      courses: {}
    };
  }
};

module.exports = {
  getProgress,
  saveProgress,
  completeLesson,
  recalculateProgress
};
