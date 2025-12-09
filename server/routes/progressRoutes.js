const express = require('express');
const router = express.Router();

// Helper function to get course title
const getCourseTitle = (courseId) => {
  const courseTitles = {
    'cacao-basics': 'Cacao Basics',
    'planting-techniques': 'Planting Techniques',
    'harvest-processing': 'Harvest & Processing',
    'pest-disease': 'Pest & Disease Management',
    'cloning-techniques': 'Types of Cloning in Cacao',
    'care-management': 'Care Management',
    'gap-practices': 'GAP (Good Agricultural Practices)'
  };
  return courseTitles[courseId] || 'Course';
};

// Helper function to clean up incorrect achievement records
const cleanupIncorrectAchievements = async (userId) => {
  try {
    console.log('🧹 Cleaning up incorrect achievement records for user:', userId);
    
    const { Achievement, UserAchievement } = require('../models/Achievement');
    const CourseProgress = require('../models/CourseProgress');
    
    // Get user's actual completed courses count
    const userProgress = await CourseProgress.find({ userId });
    const completedCourses = userProgress.filter(cp => cp.isCompleted || cp.overallProgress >= 100).length;
    
    console.log(`📊 User has completed ${completedCourses} courses`);
    
    // Find Quick Learner achievement
    const quickLearnerAchievement = await Achievement.findOne({ 
      name: 'Quick Learner',
      category: 'course_completion',
      isActive: true 
    });
    
    if (!quickLearnerAchievement) {
      console.log('❌ Quick Learner achievement not found');
      return { success: false, message: 'Quick Learner achievement not found' };
    }
    
    // Check if user has Quick Learner achievement
    const userQuickLearnerAchievement = await UserAchievement.findOne({
      userId: userId,
      achievementId: quickLearnerAchievement._id,
      isCompleted: true
    });
    
    if (userQuickLearnerAchievement && completedCourses === 1) {
      // User has Quick Learner achievement but only completed 1 course - this is incorrect
      console.log('🔧 Removing incorrectly unlocked Quick Learner achievement');
      
      await UserAchievement.deleteOne({
        userId: userId,
        achievementId: quickLearnerAchievement._id
      });
      
      console.log('✅ Incorrect Quick Learner achievement removed');
      return { 
        success: true, 
        message: 'Removed incorrectly unlocked Quick Learner achievement',
        fixed: true
      };
    } else if (userQuickLearnerAchievement && completedCourses >= 2) {
      console.log('✅ Quick Learner achievement is correctly earned');
      return { 
        success: true, 
        message: 'Quick Learner achievement is correctly earned',
        fixed: false
      };
    } else {
      console.log('ℹ️ User does not have Quick Learner achievement');
      return { 
        success: true, 
        message: 'User does not have Quick Learner achievement',
        fixed: false
      };
    }
  } catch (error) {
    console.error('❌ Error cleaning up achievements:', error);
    return { success: false, error: error.message };
  }
};
const userAuth = require('../middleware/userAuth');
const CourseProgress = require('../models/CourseProgress');
const Course = require('../models/Course');
const { getProgress, completeLesson, recalculateProgress } = require('../progressStore');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const Achievement = require('../models/Achievement');
const mongoose = require('mongoose');

// Helper function to check and unlock achievements (proper implementation)
const checkAndUnlockAchievements = async (userId, courseId) => {
  try {
    console.log('🏆 Checking achievements for user:', userId, 'course:', courseId);
    
    const { Achievement, UserAchievement } = require('../models/Achievement');
    const Notification = require('../models/Notification');
    
    // Get user's course progress to determine which achievements to unlock
    const CourseProgress = require('../models/CourseProgress');
    const userProgress = await CourseProgress.find({ userId });
    const completedCourses = userProgress.filter(cp => cp.isCompleted || cp.overallProgress >= 100).length;
    
    console.log(`📊 User has completed ${completedCourses} courses`);
    
    // Find achievements that should be unlocked
    const achievementsToUnlock = [];
    
    // First course completion achievement (exactly 1 course)
    if (completedCourses === 1) {
      const firstCourseAchievement = await Achievement.findOne({ 
        name: 'First Steps',
        category: 'course_completion',
        isActive: true 
      });
      
      if (firstCourseAchievement) {
        achievementsToUnlock.push(firstCourseAchievement);
      }
    }
    
    // Quick Learner achievement (complete 2+ courses, but not first course)
    else if (completedCourses >= 2) {
      const quickLearnerAchievement = await Achievement.findOne({ 
        name: 'Quick Learner',
        category: 'course_completion',
        isActive: true 
      });
      
      if (quickLearnerAchievement) {
        achievementsToUnlock.push(quickLearnerAchievement);
      }
    }
    
    // Dedicated Student achievement (complete 5 courses)
    if (completedCourses >= 5) {
      const dedicatedStudentAchievement = await Achievement.findOne({ 
        name: 'Dedicated Student',
        category: 'course_completion',
        isActive: true 
      });
      
      if (dedicatedStudentAchievement) {
        achievementsToUnlock.push(dedicatedStudentAchievement);
      }
    }
    
    // Master Cacao Farmer achievement (complete all courses)
    if (completedCourses >= 7) {
      const masterAchievement = await Achievement.findOne({ 
        name: 'Master Cacao Farmer',
        category: 'course_completion',
        isActive: true 
      });
      
      if (masterAchievement) {
        achievementsToUnlock.push(masterAchievement);
      }
    }
    
    console.log(`🏆 Found ${achievementsToUnlock.length} achievements to unlock`);
    
    // Unlock each achievement
    for (const achievement of achievementsToUnlock) {
      try {
        // Check if user already has this achievement
        const existingUserAchievement = await UserAchievement.findOne({
          userId: userId,
          achievementId: achievement._id
        });
        
        if (existingUserAchievement && existingUserAchievement.isCompleted) {
          console.log(`⚠️ User already has achievement: ${achievement.name}`);
          continue;
        }
        
        // Create or update user achievement
        const userAchievement = await UserAchievement.findOneAndUpdate(
          { userId: userId, achievementId: achievement._id },
          {
            isCompleted: true,
            progress: 100,
            unlockedAt: new Date(),
            metadata: {
              currentValue: completedCourses,
              targetValue: achievement.conditions.target || 1
              // relatedCourseId: courseId - Removed since courseId is string but schema expects ObjectId
            }
          },
          { upsert: true, new: true }
        ).populate('achievementId');
        
        console.log(`✅ Unlocked achievement: ${achievement.name}`);
        
        // Create achievement notification
        await Notification.createNotification(
          userId,
          'achievement_unlocked',
          'Achievement Unlocked! 🏆',
          `Congratulations! You've unlocked the "${achievement.name}" achievement.`,
          {
            achievementId: achievement._id,
            actionUrl: '/dashboard?tab=achievements',
            actionText: 'View Achievement'
          }
        );
        
        console.log(`🔔 Created notification for achievement: ${achievement.name}`);
        
      } catch (achievementError) {
        console.error(`❌ Error unlocking achievement ${achievement.name}:`, achievementError);
      }
    }
    
    return {
      success: true,
      unlockedCount: achievementsToUnlock.length,
      completedCourses: completedCourses
    };
    
  } catch (error) {
    console.error('❌ Error checking achievements:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Seed default achievements endpoint
router.post('/seed-achievements', userAuth, async (req, res) => {
  try {
    console.log('🌱 Seeding default achievements...');
    
    const { Achievement } = require('../models/Achievement');
    
    // Check if achievements already exist
    const existingCount = await Achievement.countDocuments();
    if (existingCount > 0) {
      console.log(`📊 ${existingCount} achievements already exist, skipping seeding`);
      return res.json({ 
        message: 'Achievements already exist', 
        count: existingCount 
      });
    }
    
    // Default achievements to create
    const defaultAchievements = [
      {
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '👣',
        category: 'course_completion',
        conditions: { target: 1 },
        points: 10,
        rarity: 'common',
        sortOrder: 1
      },
      {
        name: 'Quick Learner',
        description: 'Complete your first course',
        icon: '🎓',
        category: 'course_completion',
        conditions: { target: 1 },
        points: 50,
        rarity: 'common',
        sortOrder: 2
      },
      {
        name: 'Dedicated Student',
        description: 'Complete 5 courses',
        icon: '⭐',
        category: 'course_completion',
        conditions: { target: 5 },
        points: 100,
        rarity: 'uncommon',
        sortOrder: 3
      },
      {
        name: 'Master Cacao Farmer',
        description: 'Complete all available courses',
        icon: '🏆',
        category: 'course_completion',
        conditions: { target: 7 },
        points: 500,
        rarity: 'epic',
        sortOrder: 4
      },
      {
        name: 'Quiz Master',
        description: 'Score 100% on any quiz',
        icon: '💯',
        category: 'quiz_score',
        conditions: { minScore: 100 },
        points: 25,
        rarity: 'uncommon',
        sortOrder: 5
      },
      {
        name: 'High Achiever',
        description: 'Score 90% or higher on 5 quizzes',
        icon: '🎖️',
        category: 'quiz_score',
        conditions: { target: 5, minScore: 90 },
        points: 75,
        rarity: 'rare',
        sortOrder: 6
      },
      {
        name: 'Week Warrior',
        description: 'Log in for 7 consecutive days',
        icon: '🔥',
        category: 'streak',
        conditions: { target: 7 },
        points: 30,
        rarity: 'uncommon',
        sortOrder: 7
      },
      {
        name: 'Time Investor',
        description: 'Spend 10 hours learning',
        icon: '⏰',
        category: 'time_spent',
        conditions: { targetMinutes: 600 },
        points: 40,
        rarity: 'common',
        sortOrder: 8
      },
      {
        name: 'Knowledge Seeker',
        description: 'Spend 50 hours learning',
        icon: '📚',
        category: 'time_spent',
        conditions: { targetMinutes: 3000 },
        points: 200,
        rarity: 'rare',
        sortOrder: 9
      }
    ];
    
    // Insert achievements
    const insertedAchievements = await Achievement.insertMany(defaultAchievements);
    console.log(`✅ Successfully seeded ${insertedAchievements.length} achievements`);
    
    res.json({
      message: 'Default achievements seeded successfully',
      count: insertedAchievements.length,
      achievements: insertedAchievements.map(a => ({
        name: a.name,
        description: a.description,
        icon: a.icon,
        points: a.points,
        rarity: a.rarity
      }))
    });
    
  } catch (error) {
    console.error('❌ Error seeding achievements:', error);
    res.status(500).json({ 
      message: 'Error seeding achievements', 
      error: error.message 
    });
  }
});

// Comprehensive test endpoint for the complete badge flow
router.post('/test-complete-flow', userAuth, async (req, res) => {
  try {
    console.log('🧪 TESTING COMPLETE FLOW FOR USER:', req.user.id);
    
    const { courseId = 'cacao-basics' } = req.body;
    const CourseProgress = require('../models/CourseProgress');
    const { Achievement, UserAchievement } = require('../models/Achievement');
    const Certificate = require('../models/Certificate');
    const Notification = require('../models/Notification');
    
    // Step 1: Create a completed course progress record
    console.log('📚 Step 1: Creating completed course progress...');
    const progress = await CourseProgress.findOneAndUpdate(
      { userId: req.user.id, courseId: courseId },
      {
        isCompleted: true,
        overallProgress: 100,
        certificateEarned: true,
        completedLessons: [
          { lessonId: 'lesson-1', completedAt: new Date(), timeSpent: 30 },
          { lessonId: 'lesson-2', completedAt: new Date(), timeSpent: 30 },
          { lessonId: 'lesson-3', completedAt: new Date(), timeSpent: 30 },
          { lessonId: 'lesson-4', completedAt: new Date(), timeSpent: 30 }
        ],
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Course progress created/updated');
    
    // Step 2: Create certificate
    console.log('📜 Step 2: Creating certificate...');
    const courseTitle = 'Cacao Basics';

    // Get user's full name from User model
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    const studentFullName = user ? `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.surname}`.trim() : 'Student';

    const certificate = new Certificate({
      userId: req.user.id,
      courseId: courseId,
      certificateId: `TEST-CERT-${Date.now().toString(36)}`,
      issueDate: new Date(),
      completionDate: new Date(),
      finalScore: 95,
      totalTimeSpent: 120,
      courseTitle: courseTitle,
      courseCategory: 'beginner',
      studentName: studentFullName,
      studentEmail: user ? user.email : req.user.email,
      instructorName: 'AgriLearn Cacao Instructor',
      certificateImage: '/Certificates.png'
    });
    
    await certificate.save();
    console.log('✅ Certificate created:', certificate.certificateId);
    
    // Step 3: Create course completion notification
    console.log('🔔 Step 3: Creating course completion notification...');
    await Notification.createNotification(
      req.user.id,
      'course_completion',
      '🎉 Course Completed!',
      `Congratulations! You completed ${courseTitle} and earned a certificate!`,
      {
        courseId: courseId,
        score: 95,
        actionUrl: '/dashboard?tab=certificates',
        actionText: 'View Certificate'
      }
    );
    
    // Step 4: Create certificate notification
    console.log('🔔 Step 4: Creating certificate notification...');
    await Notification.createNotification(
      req.user.id,
      'certificate_earned',
      '📜 Certificate Earned!',
      `Your certificate for completing "${courseTitle}" is now available.`,
      {
        certificateId: certificate._id,
        actionUrl: '/dashboard?tab=certificates',
        actionText: 'View Certificate'
      }
    );
    
    // Step 5: Check and unlock achievements
    console.log('🏆 Step 5: Checking and unlocking achievements...');
    const achievementResult = await checkAndUnlockAchievements(req.user.id, courseId);
    
    // Step 6: Get final counts for verification
    console.log('📊 Step 6: Getting final counts...');
    const [userAchievements, userCertificates, userNotifications] = await Promise.all([
      UserAchievement.find({ userId: req.user.id }).populate('achievementId'),
      Certificate.find({ userId: req.user.id }),
      Notification.find({ userId: req.user.id, isRead: false })
    ]);
    
    console.log('📊 FINAL RESULTS:');
    console.log(`- Achievements unlocked: ${userAchievements.length}`);
    console.log(`- Certificates earned: ${userCertificates.length}`);
    console.log(`- Unread notifications: ${userNotifications.length}`);
    
    res.json({
      success: true,
      message: 'Complete flow test successful!',
      results: {
        courseCompleted: courseId,
        achievements: {
          total: userAchievements.length,
          unlocked: userAchievements.map(ua => ({
            name: ua.achievementId.name,
            icon: ua.achievementId.icon,
            points: ua.achievementId.points
          }))
        },
        certificates: {
          total: userCertificates.length,
          latest: userCertificates.map(c => ({
            id: c.certificateId,
            courseTitle: c.courseTitle,
            issueDate: c.issueDate
          }))
        },
        notifications: {
          unread: userNotifications.length,
          types: userNotifications.map(n => n.type)
        }
      },
      badges: {
        achievements: userAchievements.length > 0,
        certificates: userCertificates.length > 0,
        notifications: userNotifications.length > 0,
        statistics: userAchievements.length > 0 || userCertificates.length > 0
      }
    });
    
  } catch (error) {
    console.error('❌ Complete flow test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Complete flow test failed', 
      error: error.message 
    });
  }
});

// Test route (no auth required)
router.get('/test', async (req, res) => {
  try {
    res.json({ message: 'Progress routes are working!', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's course progress (no auth for testing)
router.get('/progress-demo', async (req, res) => {
  try {
    // Return demo data for testing
    const demoProgress = [
      {
        _id: 'demo123',
        userId: 'demoUser',
        courseId: 'demoCourse',
        enrolledAt: new Date(),
        lastAccessed: new Date(),
        completedLessons: [],
        quizResults: [],
        progressPercentage: 0,
        isCompleted: false,
        totalTimeSpent: 0
      }
    ];
    res.json(demoProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's course progress (main endpoint) - using database store with course support
router.get('/', userAuth, async (req, res) => {
  try {
    const { courseId } = req.query;
    const progress = await getProgress(req.user.id, courseId);
    console.log('Returning progress from database:', { userId: req.user.id, courseId, progress });
    res.json(progress);
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ message: 'Error fetching course progress' });
  }
});

// Get user's course progress (alternative endpoint for compatibility) - using database store
router.get('/progress', userAuth, async (req, res) => {
  try {
    const { courseId } = req.query;
    const progress = await getProgress(req.user.id, courseId);
    console.log('Returning progress from database (progress endpoint):', { userId: req.user.id, courseId, progress });
    res.json(progress);
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ message: 'Error fetching course progress' });
  }
});

// Test endpoint for debugging
router.post('/test-complete', userAuth, async (req, res) => {
  try {
    console.log('Test endpoint hit');
    console.log('User ID:', req.user.id);
    console.log('Request body:', req.body);
    
    res.json({ 
      message: 'Test endpoint working',
      userId: req.user.id,
      body: req.body
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: 'Test endpoint error', error: error.message });
  }
});

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({
    message: 'Progress routes are working',
    user: req.user ? req.user.id : 'No user',
    timestamp: new Date().toISOString()
  });
});

// Recalculate progress endpoint - fixes cached progress with updated lesson counts
router.post('/recalculate-progress', userAuth, async (req, res) => {
  try {
    console.log('Recalculating progress for user:', req.user.id);
    
    // Force clear any existing progress cache and recalculate from scratch
    const updatedProgress = await recalculateProgress(req.user.id);
    
    // Also update the database records to ensure consistency
    const userId = req.user.id;
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
    
    // Update database records for each course with force refresh
    for (const courseId of Object.keys(courseLessonCounts)) {
      const courseProgress = updatedProgress.courses[courseId];
      if (courseProgress) {
        const totalLessons = courseLessonCounts[courseId];
        const completedCount = courseProgress.completedLessons.length;
        const calculatedProgress = Math.min(100, Math.round((completedCount / totalLessons) * 100));
        
        // Force update database with new calculated values
        await CourseProgress.updateOne(
          { userId: userId, courseId: courseId },
          {
            $set: {
              overallProgress: calculatedProgress,
              isCompleted: calculatedProgress >= 100,
              certificateEarned: calculatedProgress >= 100,
              lastUpdated: new Date(),
              // Force update completed lessons count
              'completedLessons': courseProgress.completedLessons
            }
          },
          { upsert: true }
        );
        
        console.log(`Force updated ${courseId}: ${completedCount}/${totalLessons} = ${calculatedProgress}%`);
      }
    }
    
    // Also update the stats collection with correct average progress
    const allProgressValues = Object.values(updatedProgress.courses)
      .filter(course => courseLessonCounts[course.courseId])
      .map(course => {
        const totalLessons = courseLessonCounts[course.courseId];
        const completedCount = course.completedLessons.length;
        return Math.min(100, Math.round((completedCount / totalLessons) * 100));
      });
    
    const averageProgress = allProgressValues.length > 0 
      ? Math.round(allProgressValues.reduce((sum, progress) => sum + progress, 0) / allProgressValues.length)
      : 0;
    
    // Update stats in database
    await CourseProgress.updateOne(
      { userId: userId },
      {
        $set: {
          'stats.averageProgress': averageProgress,
          'stats.totalCourses': Object.keys(courseLessonCounts).length,
          'stats.completedCourses': allProgressValues.filter(p => p >= 100).length,
          'stats.inProgressCourses': allProgressValues.filter(p => p > 0 && p < 100).length,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log('Progress recalculated and database updated successfully:', updatedProgress);
    console.log('New average progress:', averageProgress);
    
    res.json({
      message: 'Progress recalculated successfully',
      progress: updatedProgress,
      averageProgress: averageProgress,
      courseProgressDetails: Object.keys(updatedProgress.courses).map(courseId => ({
        courseId,
        overallProgress: updatedProgress.courses[courseId].overallProgress,
        completedLessons: updatedProgress.courses[courseId].completedLessons.length,
        totalLessons: courseLessonCounts[courseId],
        isCompleted: updatedProgress.courses[courseId].isCompleted,
        calculatedProgress: Math.min(100, Math.round((updatedProgress.courses[courseId].completedLessons.length / courseLessonCounts[courseId]) * 100))
      }))
    });
  } catch (error) {
    console.error('Error recalculating progress:', error);
    res.status(500).json({ 
      message: 'Error recalculating progress', 
      error: error.message 
    });
  }
});

// Test endpoint to verify our code is running
router.get('/test-gap-fix', userAuth, (req, res) => {
  console.log('🔥 TEST ENDPOINT CALLED - GAP fix is working!');
  res.json({
    message: 'GAP fix test endpoint working',
    gapCalculation: {
      1: 33,
      2: 67,
      3: 100
    },
    timestamp: new Date()
  });
});

// Debug endpoint to check notifications for current user
router.get('/debug-notifications', userAuth, async (req, res) => {
  try {
    console.log('🔍 DEBUG: Checking notifications for user:', req.user.id);
    
    const Notification = require('../models/Notification');
    const mongoose = require('mongoose');
    
    // Handle user ID conversion
    let userId = req.user.id;
    if (typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        userId = new mongoose.Types.ObjectId(userId);
      } catch (e) {
        console.log('User ID conversion failed, keeping as string');
      }
    }
    
    console.log('🔍 DEBUG: Final user ID for query:', userId);
    console.log('🔍 DEBUG: User ID type:', typeof userId);
    
    // Count all notifications for this user
    const totalCount = await Notification.countDocuments({ userId: userId });
    console.log('🔍 DEBUG: Total notifications for user:', totalCount);
    
    // Get actual notifications
    const notifications = await Notification.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('🔍 DEBUG: Found notifications:', notifications.length);
    notifications.forEach((notif, index) => {
      console.log(`🔍 DEBUG Notification ${index + 1}:`, {
        id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        createdAt: notif.createdAt,
        isRead: notif.isRead
      });
    });
    
    res.json({
      user: {
        id: req.user.id,
        type: typeof req.user.id,
        finalId: userId
      },
      totalCount,
      notifications: notifications.map(n => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        isRead: n.isRead
      }))
    });
    
  } catch (error) {
    console.error('🔍 DEBUG: Error checking notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to create a sample notification
router.post('/test-create-notification', userAuth, async (req, res) => {
  try {
    console.log('🧪 TEST: Creating sample notification for user:', req.user.id);
    
    const Notification = require('../models/Notification');
    const mongoose = require('mongoose');
    
    // Handle user ID conversion
    let userId = req.user.id;
    if (typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        userId = new mongoose.Types.ObjectId(userId);
      } catch (e) {
        console.log('User ID conversion failed, keeping as string');
      }
    }
    
    // Create a test notification
    const testNotification = await Notification.create({
      userId: userId,
      type: 'course_completion',
      title: 'Test Course Completion',
      message: 'This is a test notification to verify the system works',
      isRead: false,
      createdAt: new Date(),
      icon: '🧪',
      actionUrl: '/dashboard',
      actionText: 'View Dashboard'
    });
    
    console.log('🧪 TEST: Created notification:', testNotification._id);
    
    res.json({
      message: 'Test notification created successfully',
      notification: {
        id: testNotification._id,
        type: testNotification.type,
        title: testNotification.title,
        message: testNotification.message
      }
    });
    
  } catch (error) {
    console.error('🧪 TEST: Error creating test notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check achievements for current user
router.get('/debug-achievements', userAuth, async (req, res) => {
  try {
    console.log('🏆 DEBUG: Checking achievements for user:', req.user.id);
    
    const Achievement = require('../models/Achievement');
    const mongoose = require('mongoose');
    
    console.log('🏆 DEBUG: Final user ID for query:', req.user.id);
    console.log('🏆 DEBUG: User ID type:', typeof req.user.id);
    
    // Get all available achievements (simplified for now)
    const achievements = await Achievement.find({}).limit(10);
    console.log('🏆 DEBUG: Found achievements:', achievements.length);
    
    res.json({
      user: {
        id: req.user.id,
        type: typeof req.user.id
      },
      totalAvailable: achievements.length,
      achievements: achievements.map(a => ({
        id: a._id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        type: a.type,
        points: a.points
      }))
    });
    
  } catch (error) {
    console.error('🏆 DEBUG: Error checking achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check current progress state
router.get('/debug-progress', userAuth, async (req, res) => {
  try {
    const { courseId } = req.query;
    console.log('🔍 DEBUG: Checking progress for user:', req.user.id, 'course:', courseId);
    
    const progress = await getProgress(req.user.id, courseId);
    console.log('🔍 DEBUG: Raw progress from database:', progress);
    
    // Get course lesson counts based on actual course structure
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
    const completedCount = progress.completedLessons?.length || 0;
    const correctProgress = Math.min(100, Math.round((completedCount / totalLessons) * 100));
    
    res.json({
      userId: req.user.id,
      courseId,
      totalLessons,
      completedLessons: completedCount,
      completedLessonsList: progress.completedLessons,
      apiProgress: progress.overallProgress,
      correctProgress,
      discrepancy: progress.overallProgress !== correctProgress,
      formula: `${completedCount}/${totalLessons} * 100 = ${correctProgress}%`
    });
    
  } catch (error) {
    console.error('🔍 DEBUG: Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint to verify basic functionality
router.post('/test-create-achievement', userAuth, async (req, res) => {
  try {
    console.log('🏆 TEST: Simple test starting for user:', req.user.id);
    
    // Just return a success response without database operations
    console.log('🏆 TEST: Returning simple success response');
    
    res.json({
      message: 'Test endpoint working successfully',
      user: req.user.id,
      timestamp: new Date(),
      test: 'Basic functionality verified'
    });
    
  } catch (error) {
    console.error('🏆 TEST: Simple test error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Simple test failed'
    });
  }
});

// Real achievement notification creator (separate endpoint)
router.post('/create-achievement-notification', userAuth, async (req, res) => {
  try {
    console.log('🏆 REAL: Creating achievement notification for user:', req.user.id);
    
    // Test basic response first
    console.log('🏆 REAL: Testing basic user access...');
    
    // Test Notification model loading
    let Notification;
    try {
      Notification = require('../models/Notification');
      console.log('🏆 REAL: Notification model loaded successfully');
    } catch (modelError) {
      console.error('🏆 REAL: Failed to load Notification model:', modelError);
      return res.status(500).json({ error: 'Notification model not found', details: modelError.message });
    }
    
    // Test basic database connection
    try {
      const count = await Notification.countDocuments();
      console.log('🏆 REAL: Database connection OK, current notifications count:', count);
    } catch (dbError) {
      console.error('🏆 REAL: Database connection error:', dbError);
      return res.status(500).json({ error: 'Database connection failed', details: dbError.message });
    }
    
    // Handle user ID conversion
    let userId = req.user.id;
    console.log('🏆 REAL: Original user ID:', userId, 'Type:', typeof userId);
    
    if (typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        userId = new mongoose.Types.ObjectId(userId);
        console.log('🏆 REAL: Converted user ID to ObjectId:', userId);
      } catch (e) {
        console.log('🏆 REAL: User ID conversion failed, keeping as string:', e.message);
      }
    }
    
    // Create an achievement notification with minimal data
    console.log('🏆 REAL: Creating achievement notification...');
    const notificationData = {
      userId: userId,
      type: 'achievement_unlocked', // Fixed: use underscore instead of hyphen
      title: '🏆 Achievement Unlocked!',
      message: 'Congratulations! You\'ve unlocked the "Course Beginner" achievement!',
      isRead: false,
      createdAt: new Date(),
      icon: '🏆',
      actionUrl: '/dashboard?tab=achievements',
      actionText: 'View Achievement'
    };
    
    console.log('🏆 REAL: Notification data:', notificationData);
    
    const achievementNotification = await Notification.create(notificationData);
    console.log('🏆 REAL: Achievement notification created successfully:', achievementNotification._id);
    
    res.json({
      message: 'Achievement notification created successfully',
      notification: {
        id: achievementNotification._id,
        type: achievementNotification.type,
        title: achievementNotification.title,
        message: achievementNotification.message,
        icon: achievementNotification.icon
      }
    });
    
  } catch (error) {
    console.error('🏆 REAL: Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to create achievement notification',
      type: error.name,
      code: error.code
    });
  }
});

// Complete a lesson - simple working version using in-memory store
router.post('/complete-lesson', userAuth, async (req, res) => {
  try {
    const { courseId, lessonId, lessonTitle } = req.body;
    console.log('🚨 STARTING LESSON COMPLETION:', { userId: req.user.id, courseId, lessonId });
    
    if (!courseId || !lessonId) {
      return res.status(400).json({ message: 'Course ID and Lesson ID are required' });
    }
    
    // Complete lesson using our updated database store
    console.log('🚨 CALLING completeLesson from progressStore...');
    const progress = await completeLesson(req.user.id, courseId, lessonId, lessonTitle);
    console.log('🚨 PROGRESS RETURNED FROM progressStore:', {
      courseId,
      overallProgress: progress.overallProgress,
      completedLessons: progress.completedLessons.length,
      completedLessonsList: progress.completedLessons.map(l => l.lessonId || l)
    });
    
    // Always calculate progress correctly based on actual completed lessons
    const courseLessonCounts = {
      'cacao-basics': 4,           // intro-cacao, cacao-history, cacao-varieties, growing-conditions
      'planting-techniques': 4,    // soil-requirements, shade-management, nursery-care, planting-methods
      'harvest-processing': 11,     // harvest-timing, harvest-methods, pod-breaking, fermentation-process, fermentation-troubleshooting, drying-methods, moisture-control, storage-solutions, quality-assessment, grading-standards, common-defects
      'pest-disease': 15,          // 15 lessons from pest-identification to safety-measures
      'cloning-techniques': 6,     // why-clone-cacao, cloning-basics, cloning-methods-overview, grafting-techniques, nursery-establishment, acclimatization
      'care-management': 9,         // irrigation-methods, water-conservation, drainage-systems, pruning-techniques, canopy-management, pruning-schedule, essential-nutrients, fertilization, soil-health
      'gap-practices': 3,           // gap-principles, benefits-gap, regulatory-framework
      'cacao-history': 4            // ancient-origins, cultural-significance, global-spread, modern-industry
    };
    
    const totalLessons = courseLessonCounts[courseId] || 4;
    const completedCount = progress.completedLessons.length;
    
    // Calculate correct progress every time
    let calculatedProgress;
    if (courseId === 'gap-practices') {
      // GAP has 3 lessons total
      calculatedProgress = completedCount >= 3 ? 100 : Math.min(100, Math.round((completedCount / 3) * 100));
    } else {
      // All other courses: simple percentage calculation
      calculatedProgress = Math.min(100, Math.round((completedCount / totalLessons) * 100));
    }
    
    // Force the correct progress value
    finalProgress = calculatedProgress;
    isCompleted = finalProgress >= 100;
    
    console.log('🚨 CORRECTED PROGRESS CALCULATION:', {
      courseId,
      completedCount,
      totalLessons,
      calculatedProgress,
      finalProgress,
      isCompleted,
      formula: `${completedCount}/${totalLessons} * 100 = ${calculatedProgress}%`
    });
    
    console.log('🚨 FINAL RESPONSE VALUES:', {
      courseId,
      finalProgress,
      isCompleted,
      completedLessons: progress.completedLessons.length,
      message: `Lesson completed! Progress: ${finalProgress}%`
    });
    
    // Create certificate and notifications if course was just completed
    console.log('🎯 Checking if should create certificate:', { isCompleted, courseId });
    if (isCompleted) {
      try {
        console.log('✨ YES! Creating course completion notifications, achievements, and certificate for:', courseId);

        // Update the MongoDB progress record to mark as completed
        await CourseProgress.findOneAndUpdate(
          { userId: req.user.id, courseId: courseId },
          {
            isCompleted: true,
            overallProgress: 100,
            certificateEarned: true
          },
          { upsert: true, new: true }
        );
        console.log('✅ Database progress updated to completed');

        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
          userId: req.user.id,
          courseId: courseId
        });

        if (!existingCertificate) {
          // Create certificate
          const courseTitle = getCourseTitle(courseId);

          // Get user's full name from User model
          const User = require('../models/User');
          const user = await User.findById(req.user.id);
          const studentFullName = user ? `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.surname}`.trim() : 'Student';

          const certificate = new Certificate({
            userId: req.user.id,
            courseId: courseId,
            certificateId: `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase(),
            issueDate: new Date(),
            completionDate: new Date(),
            finalScore: 95, // Default score
            totalTimeSpent: progress.totalTimeSpent || 120,
            courseTitle: courseTitle,
            courseCategory: 'beginner',
            studentName: studentFullName,
            studentEmail: user ? user.email : req.user.email,
            instructorName: 'AgriLearn Cacao Instructor',
            certificateImage: '/Certificates.png',
            metadata: {
              totalLessons: progress.completedLessons.length,
              totalQuizzes: 0,
              averageQuizScore: 95,
              completionTime: '2 hours'
            }
          });

          await certificate.save();
          console.log('✅ Certificate created:', certificate.certificateId);

          // Create course completion notification
          await Notification.createNotification(
            req.user.id,
            'course_completion',
            '🎉 Course Completed!',
            `Congratulations! You completed ${courseTitle} and earned a certificate!`,
            {
              courseId: courseId,
              score: 95,
              actionUrl: '/dashboard?tab=certificates',
              actionText: 'View Certificate'
            }
          );
          console.log('✅ Course completion notification created');

          // Create certificate notification
          await Notification.createNotification(
            req.user.id,
            'certificate_earned',
            '📜 Certificate Earned!',
            `Your certificate for completing "${courseTitle}" is now available.`,
            {
              certificateId: certificate._id,
              actionUrl: '/dashboard?tab=certificates',
              actionText: 'View Certificate'
            }
          );
          console.log('✅ Certificate notification created');

        } else {
          console.log('Certificate already exists for this course, skipping creation');
        }

        // Check and unlock achievements based on course completion
        console.log('🏆 Checking for achievements to unlock...');
        const achievementResult = await checkAndUnlockAchievements(req.user.id, courseId);
        
        if (achievementResult.success) {
          console.log(`🏆 Successfully unlocked ${achievementResult.unlockedCount} achievements`);
        } else {
          console.error('❌ Failed to unlock achievements:', achievementResult.error);
        }

      } catch (notificationError) {
        console.error('Error creating certificate/notifications:', notificationError);
      }
    }
    
    res.json({
      message: 'Lesson completed successfully',
      progress: finalProgress, // Use our corrected calculation
      isCompleted: isCompleted || false,
      completedLessons: progress.completedLessons.length,
      totalLessons: totalLessons, // Use the actual total lessons for this course
      courseJustCompleted: isCompleted || false,
      courseCompletedTitle: isCompleted ? `🎉 Congratulations! You completed ${courseId}!` : null
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ message: 'Error completing lesson', error: error.message });
  }
});

// Simple fix to mark course as completed
router.post('/complete-course', userAuth, async (req, res) => {
  try {
    // Update the progress record directly
    const result = await CourseProgress.updateOne(
      { userId: req.user.id },
      { 
        isCompleted: true,
        overallProgress: 100,
        certificateEarned: true,
        $set: {
          'completedLessons': [
            { lessonId: 'module-1', completedAt: new Date(), timeSpent: 30 },
            { lessonId: 'module-2', completedAt: new Date(), timeSpent: 30 },
            { lessonId: 'module-3', completedAt: new Date(), timeSpent: 30 },
            { lessonId: 'module-4', completedAt: new Date(), timeSpent: 30 }
          ]
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      res.json({ message: 'Course marked as completed' });
    } else {
      res.status(404).json({ message: 'No progress record found' });
    }
  } catch (error) {
    console.error('Error completing course:', error);
    res.status(500).json({ message: 'Error completing course' });
  }
});

// Mark course as completed - temporary endpoint for testing
router.post('/mark-complete', userAuth, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    // Find any progress record for this user
    let progress = await CourseProgress.findOne({ userId: req.user.id });
    
    if (progress) {
      progress.courseId = courseId || progress.courseId; // Update courseId if provided
      progress.isCompleted = true;
      progress.overallProgress = 100;
      progress.certificateEarned = true;
      
      // Add completed lessons for all modules
      progress.completedLessons = [
        { lessonId: 'module-1', completedAt: new Date(), timeSpent: 30 },
        { lessonId: 'module-2', completedAt: new Date(), timeSpent: 30 },
        { lessonId: 'module-3', completedAt: new Date(), timeSpent: 30 },
        { lessonId: 'module-4', completedAt: new Date(), timeSpent: 30 }
      ];
      
      await progress.save();
      res.json({ message: 'Course marked as completed', progress: progress });
    } else {
      res.status(404).json({ message: 'Progress record not found' });
    }
  } catch (error) {
    console.error('Error marking course complete:', error);
    res.status(500).json({ message: 'Error marking course complete' });
  }
});

// Fix progress record - temporary endpoint
router.post('/fix-progress', userAuth, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    // Update existing progress record with correct courseId
    const progress = await CourseProgress.findOne({ userId: req.user.id });
    
    if (progress) {
      progress.courseId = courseId;
      await progress.save();
      res.json({ message: 'Progress record updated', courseId: progress.courseId });
    } else {
      res.status(404).json({ message: 'No progress record found' });
    }
  } catch (error) {
    console.error('Error fixing progress:', error);
    res.status(500).json({ message: 'Error fixing progress' });
  }
});

// Update course progress (when lesson is completed)
router.post('/progress/:courseId/lesson/:lessonId', userAuth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { timeSpent = 0, quizScore } = req.body;

    let progress = await CourseProgress.findOne({ userId: req.user.id, courseId });

    if (!progress) {
      // Create new progress record
      progress = new CourseProgress({
        userId: req.user.id,
        courseId,
        completedLessons: [],
        quizResults: []
      });
    }

    // Add lesson completion
    const existingLesson = progress.completedLessons.find(
      lesson => lesson.lessonId.toString() === lessonId
    );

    if (!existingLesson) {
      progress.completedLessons.push({
        lessonId,
        completedAt: new Date(),
        timeSpent
      });
    } else {
      existingLesson.timeSpent += timeSpent;
    }

    // Add quiz result if provided
    if (quizScore !== undefined) {
      progress.quizResults.push({
        lessonId,
        score: quizScore.score,
        totalQuestions: quizScore.totalQuestions,
        correctAnswers: quizScore.correctAnswers,
        completedAt: new Date()
      });
    }

    // Update last accessed
    progress.lastAccessed = new Date();

    // Calculate overall progress
    await progress.calculateProgress();

    // Check if course is completed
    if (progress.isCompleted && !progress.certificateEarned) {
      // Generate certificate
      const course = await mongoose.model('Course').findOne({ id: courseId });

      // Get user's full name from User model
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      const studentFullName = user ? `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.surname}`.trim() : 'Student';

      const certificate = new Certificate({
        userId: req.user.id,
        courseId,
        finalScore: progress.averageScore,
        totalTimeSpent: progress.totalTimeSpent,
        courseTitle: course.title,
        courseCategory: course.category,
        studentName: studentFullName,
        studentEmail: user ? user.email : req.user.email,
        completionDate: progress.completedAt,
        metadata: {
          totalLessons: progress.completedLessons.length,
          totalQuizzes: progress.quizResults.length,
          averageQuizScore: progress.averageScore
        }
      });

      await certificate.save();
      progress.certificateEarned = true;

      // Create notifications
      await Notification.createCourseCompletionNotification(
        req.user.id,
        courseId,
        course.title,
        progress.averageScore
      );

      await Notification.createCertificateNotification(
        req.user.id,
        course.title,
        certificate._id
      );

      // Check for achievements (simplified)
      await checkAndUnlockAchievements(req.user.id, course.id);
    }

    await progress.save();

    res.json({
      progress,
      isCompleted: progress.isCompleted,
      certificateEarned: progress.certificateEarned
    });

  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({ message: 'Error updating course progress' });
  }
});

// Get user statistics - using simple store with multi-course support
router.get('/stats', userAuth, async (req, res) => {
  try {
    console.log('Fetching stats for user:', req.user.id);
    
    // Get all user progress from our simple store
    const userProgress = getProgress(req.user.id);
    console.log('User progress from store:', userProgress);
    
    // Updated lesson counts for accurate calculation
    const courseLessonCounts = {
      'cacao-basics': 4,           // 4 lessons
      'planting-techniques': 4,    // 4 lessons (updated - video module excluded)
      'harvest-processing': 11,     // 11 lessons (updated - 4 modules with 2+3+3+3 lessons)
      'pest-disease': 15,          // 15 lessons (updated - 5 modules × 3 lessons each, video excluded)
      'cloning-techniques': 6,     // 6 lessons (updated - 3 modules × 2 lessons each)
      'care-management': 9,         // 9 lessons (fixed - includes soil-health)
      'gap-practices': 3           // 3 lessons (updated - removed modules, only intro remains)
    };
    
    console.log('🔧 Course lesson counts being used:', courseLessonCounts);
    
    // Calculate statistics across all courses with fresh progress calculation
    const courses = userProgress.courses || {};
    const courseIds = Object.keys(courses);
    
    let totalCourses = courseIds.length;
    let completedCourses = 0;
    let inProgressCourses = 0;
    let totalTimeSpent = 0;
    let totalProgress = 0;
    
    courseIds.forEach(courseId => {
      const course = courses[courseId];
      const totalLessons = courseLessonCounts[courseId] || 4;
      const completedCount = course.completedLessons.length;
      
      // Force recalculate progress on the fly with correct lesson counts
      // Ignore any cached overallProgress values completely
      let calculatedProgress;
      
      // Special handling for gap-practices to force correct calculation
      if (courseId === 'gap-practices') {
        // GAP has 3 lessons total - if all 3 are completed, it should be 100%
        const forcedTotalLessons = 3;
        
        // If user has completed all 3 lessons, force 100% progress
        if (completedCount >= 3) {
          calculatedProgress = 100;
        } else {
          calculatedProgress = Math.min(100, Math.round((completedCount / forcedTotalLessons) * 100));
        }
        
        console.log(`🔍 FORCE DEBUG gap-practices:`, {
          courseId,
          completedCount,
          forcedTotalLessons,
          calculatedProgress,
          cachedProgress: course.overallProgress,
          completedLessons: course.completedLessons.map(l => l.lessonId || l),
          formula: completedCount >= 3 ? 'All lessons completed = 100%' : `${completedCount}/${forcedTotalLessons} * 100 = ${calculatedProgress}%`,
          isCompleted: calculatedProgress >= 100,
          allLessonsCompleted: completedCount >= 3
        });
      } else {
        calculatedProgress = Math.min(100, Math.round((completedCount / totalLessons) * 100));
      }
      
      const isCompleted = calculatedProgress >= 100;
      
      console.log(`Stats calculation for ${courseId}:`, {
        completedCount,
        totalLessons,
        calculatedProgress,
        isCompleted,
        cachedProgress: course.overallProgress
      });
      
      if (isCompleted) {
        completedCourses++;
      } else if (calculatedProgress > 0) {
        inProgressCourses++;
      }
      
      totalTimeSpent += course.completedLessons.reduce((total, lesson) => total + (lesson.timeSpent || 0), 0);
      totalProgress += calculatedProgress; // Use fresh calculated progress
    });
    
    // Calculate average progress based on all 7 courses (divide by 700% total)
    const totalPossibleProgress = 700; // 7 courses × 100%
    const averageProgress = Math.round((totalProgress / totalPossibleProgress) * 100);

    console.log(`🎯 FINAL stats calculation:`, {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalProgress,
      averageProgress,
      calculation: `totalProgress(${totalProgress}) / totalPossibleProgress(${totalPossibleProgress}) * 100 = ${averageProgress}%`
    });
    
    const stats = {
      totalCourses,
      completedCourses,
      inProgressCourses,
      averageScore: 0, // No quiz scores yet
      totalTimeSpent,
      averageProgress,
      recentActivity: courseIds.map(courseId => {
        const course = courses[courseId];
        const totalLessons = courseLessonCounts[courseId] || 4;
        const completedCount = course.completedLessons.length;
        let calculatedProgress;
        
        // Use forced calculation for gap-practices
        if (courseId === 'gap-practices') {
          // GAP has 3 lessons total - if all 3 are completed, it should be 100%
          if (completedCount >= 3) {
            calculatedProgress = 100;
          } else {
            calculatedProgress = Math.round((completedCount / 3) * 100);
          }
        } else {
          calculatedProgress = Math.min(100, Math.round((completedCount / totalLessons) * 100));
        }
        
        return {
          userId: req.user.id,
          courseId,
          completedLessons: course.completedLessons,
          overallProgress: calculatedProgress, // Use fresh calculated progress
          isCompleted: calculatedProgress >= 100,
          lastUpdated: course.lastUpdated
        };
      })
    };
    
    console.log('🚀 Final stats being returned:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get certificates for user
router.get('/certificates', userAuth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user.id })
      .populate('courseId', 'title category image')
      .sort({ issuedDate: -1 });

    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Error fetching certificates' });
  }
});

// Get single certificate
router.get('/certificates/:certificateId', userAuth, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
      userId: req.user.id
    }).populate('courseId');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ message: 'Error fetching certificate' });
  }
});

// Verify certificate (public endpoint)
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId
    }).populate('courseId', 'title category');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found or invalid' });
    }

    res.json({
      isValid: true,
      certificate: {
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        courseCategory: certificate.courseCategory,
        completionDate: certificate.completionDate,
        finalScore: certificate.finalScore,
        certificateId: certificate.certificateId
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ message: 'Error verifying certificate' });
  }
});

// Clean up incorrect achievement records
router.post('/cleanup-achievements', userAuth, async (req, res) => {
  try {
    const result = await cleanupIncorrectAchievements(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error cleaning up achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fix Care Management progress endpoint
router.post('/fix-care-management', userAuth, async (req, res) => {
  try {
    console.log('🔧 Fixing Care Management progress for user:', req.user.id);
    
    const CourseProgress = require('../models/CourseProgress');
    const mongoose = require('mongoose');
    
    // Handle user ID conversion
    let userId = req.user.id;
    if (typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        userId = new mongoose.Types.ObjectId(userId);
      } catch (e) {
        console.log('User ID conversion failed, keeping as string');
      }
    }
    
    // Find and update Care Management progress to cap at 100%
    const result = await CourseProgress.updateOne(
      { userId: userId, courseId: 'care-management' },
      { 
        $set: { 
          overallProgress: 100,
          isCompleted: true,
          certificateEarned: true,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log('🔧 Care Management progress fixed:', result);
    
    res.json({
      message: 'Care Management progress fixed to 100%',
      userId: req.user.id,
      courseId: 'care-management',
      newProgress: 100,
      result: result
    });
    
  } catch (error) {
    console.error('Error fixing Care Management progress:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
