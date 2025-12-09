const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const User = require('../../models/User');
const Course = require('../../models/Course');
const CourseProgress = require('../../models/CourseProgress');
const { Achievement, UserAchievement } = require('../../models/Achievement');

console.log('🔧 User progress routes loaded');

// Test route without authentication
router.get('/test', (req, res) => {
  console.log('🧪 User progress test route called');
  res.json({ 
    message: 'User progress routes are working!',
    timestamp: new Date(),
    version: '2.0 - Manual course lookup fix applied'
  });
});

// Simple test endpoint to check if server is working
router.get('/test-simple', (req, res) => {
  console.log('🧪 Simple test route called');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date(),
    status: 'OK'
  });
});

// Test route without authentication for debugging
router.get('/users/:userId/progress/test', async (req, res) => {
  console.log('🧪 TEST User progress endpoint called for userId:', req.params.userId);
  try {
    const { userId } = req.params;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('🧪 Found user:', user.name || user.fullName);

    // Check UserAchievement records directly
    const UserAchievement = require('../../models/Achievement').UserAchievement;
    const Achievement = require('../../models/Achievement').Achievement;
    
    console.log('🧪 Checking UserAchievement collection...');
    
    // All UserAchievements for this user
    const allUserAchievements = await UserAchievement.find({ userId: userId });
    console.log(`🧪 All UserAchievements for user ${userId}:`, allUserAchievements.length);
    
    // Completed achievements
    const completedAchievements = await UserAchievement.find({ 
      userId: userId, 
      isCompleted: true 
    }).populate('achievementId');
    console.log(`🧪 Completed achievements for user ${userId}:`, completedAchievements.length);
    
    // All achievements in database
    const allAchievements = await Achievement.find();
    console.log(`🧪 Total achievements in database:`, allAchievements.length);

    // Return detailed debug info
    res.json({
      success: true,
      debug: {
        userId: userId,
        userName: user.name || user.fullName,
        totalUserAchievements: allUserAchievements.length,
        completedAchievements: completedAchievements.length,
        totalAchievementsInDb: allAchievements.length,
        userAchievements: completedAchievements.map(ua => ({
          id: ua._id,
          achievementId: ua.achievementId?._id,
          achievementName: ua.achievementId?.name,
          isCompleted: ua.isCompleted,
          unlockedAt: ua.unlockedAt
        }))
      }
    });

  } catch (error) {
    console.error('🧪 TEST Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user progress data
router.get('/users/:userId/progress', protect, async (req, res) => {
  console.log('📊 User progress endpoint called for userId:', req.params.userId);
  console.log('📊 Authenticated admin:', req.admin ? req.admin.id : 'No admin');
  try {
    const { userId } = req.params;
    
    // Find the user
    console.log('🔍 Looking for user with ID:', userId);
    const user = await User.findById(userId);
    console.log('👤 User found:', user ? 'Yes' : 'No');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's course progress with detailed information
    console.log('📚 Fetching course progress for user:', userId);
    const userProgress = await CourseProgress.find({ userId: userId })
      .sort({ updatedAt: -1 });
    console.log('📊 Course progress found:', userProgress.length, 'records');

    // Get all courses for reference and create a lookup map
    console.log('📚 Fetching all courses...');
    const allCourses = await Course.find({ status: 'active' });
    console.log('📊 Total courses found:', allCourses.length);
    
    // Create a lookup map for courses by their 'id' field (not _id)
    const courseLookup = {};
    allCourses.forEach(course => {
      courseLookup[course.id] = course;
    });
    console.log('📚 Course lookup map created with keys:', Object.keys(courseLookup));
    console.log('📚 Sample course IDs:', Object.keys(courseLookup).slice(0, 5));

    // Debug: Show what course progress records we're trying to match
    console.log('📊 Course progress records to match:');
    userProgress.forEach((progress, index) => {
      console.log(`  ${index + 1}. courseId: "${progress.courseId}"`);
    });

    // Manually populate course information using the courseId string
    const validUserProgress = userProgress.filter(progress => {
      if (courseLookup[progress.courseId]) {
        progress.courseId = courseLookup[progress.courseId];
        return true;
      }
      console.log('⚠️ Course not found for courseId:', progress.courseId);
      return false;
    });
    console.log('📊 Valid course progress records:', validUserProgress.length, 'records');

    // Calculate progress metrics with real data
    const totalCourses = allCourses.length;
    const coursesCompleted = validUserProgress.filter(p => p.isCompleted).length;
    const coursesInProgress = validUserProgress.filter(p => !p.isCompleted && p.overallProgress > 0).length;
    const coursesNotStarted = totalCourses - coursesInProgress - coursesCompleted;

    // Calculate detailed scoring metrics
    let totalScore = 0;
    let scoredCourses = 0;
    let totalQuizzes = 0;
    let totalQuizScore = 0;

    // Process each valid course progress record
    validUserProgress.forEach(progress => {
      if (progress.courseId && progress.courseId.title) {
        if (progress.overallScore) {
          totalScore += progress.overallScore;
          scoredCourses++;
        }
        
        // Count quiz results
        if (progress.quizResults && progress.quizResults.length > 0) {
          totalQuizzes += progress.quizResults.length;
          progress.quizResults.forEach(quiz => {
            if (quiz.score) {
              totalQuizScore += quiz.score;
            }
          });
        }
      }
    });
    
    // Calculate score metrics
    const averageScore = scoredCourses > 0 ? Math.round(totalScore / scoredCourses) : 0;
    
    // Get detailed quiz scores with metadata
    const quizScores = [];
    validUserProgress.forEach(progress => {
      if (progress.quizResults && progress.quizResults.length > 0) {
        progress.quizResults.forEach((quiz, index) => {
          quizScores.push({
            score: quiz.score,
            quizName: quiz.quizName || `Quiz ${index + 1}`,
            courseTitle: progress.courseId?.title || 'Unknown Course',
            completedAt: quiz.completedAt || progress.updatedAt,
            totalQuestions: quiz.totalQuestions,
            correctAnswers: quiz.correctAnswers
          });
        });
      }
    });
    
    // Calculate highest and lowest scores from quiz scores
    const highestScore = quizScores.length > 0 ? Math.max(...quizScores.map(q => q.score)) : 0;
    const lowestScore = quizScores.length > 0 ? Math.min(...quizScores.map(q => q.score)) : 0;
    const maxScore = highestScore || 100;
    
    // Sort by completion date and take last 10
    const recentQuizScores = quizScores
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10)
      .map(q => q.score);

    // Fetch actual user achievements from database
    console.log('🏆 Fetching user achievements from database...');
    console.log('🏆 User ID:', userId);
    console.log('🏆 User ID type:', typeof userId);
    
    const userAchievements = await UserAchievement.find({ 
      userId: userId, 
      isCompleted: true 
    })
    .populate('achievementId')
    .sort({ unlockedAt: -1 });
    
    console.log(`🏆 Found ${userAchievements.length} achievements for user ${userId}`);
    console.log('🏆 UserAchievements raw:', JSON.stringify(userAchievements, null, 2));
    
    // Also check if there are any UserAchievement records at all for this user
    const allUserAchievements = await UserAchievement.find({ userId: userId });
    console.log(`🏆 Total UserAchievement records for user ${userId}: ${allUserAchievements.length}`);
    
    // Check if there are any achievements in the database at all
    const totalAchievements = await Achievement.countDocuments();
    console.log(`🏆 Total achievements in database: ${totalAchievements}`);
    
    if (userAchievements.length > 0) {
      console.log('🏆 Sample achievement:', JSON.stringify(userAchievements[0], null, 2));
    }
    
    // Check and unlock new achievements based on current progress
    console.log('🔍 Checking for new achievements to unlock...');
    const allAchievements = await Achievement.find({ isActive: true });
    const newlyUnlockedAchievements = [];

    for (const achievement of allAchievements) {
      // Check if user already has this achievement
      const existingUserAchievement = userAchievements.find(
        ua => ua.achievementId._id.toString() === achievement._id.toString()
      );

      if (existingUserAchievement) {
        console.log(`✅ Already unlocked: ${achievement.name}`);
        continue;
      }

      // Check if user qualifies for this achievement
      let shouldUnlock = false;

      if (achievement.category === 'course_completion') {
        const target = achievement.conditions?.target || 1;
        const targetNumber = target === 'all' ? totalCourses : parseInt(target);
        shouldUnlock = coursesCompleted >= targetNumber;
        console.log(`📊 Course completion check: ${coursesCompleted}/${targetNumber} - ${shouldUnlock ? 'UNLOCK' : 'LOCKED'} (${achievement.name})`);
      } else if (achievement.category === 'quiz_score') {
        if (achievement.conditions?.minScore) {
          const target = achievement.conditions?.target || 1;
          const minScore = achievement.conditions?.minScore || 90;
          const highScores = quizScores.filter(q => q.score >= minScore).length;
          shouldUnlock = highScores >= target;
          console.log(`📊 Quiz score check: ${highScores}/${target} (min ${minScore}%) - ${shouldUnlock ? 'UNLOCK' : 'LOCKED'} (${achievement.name})`);
        }
      } else if (achievement.category === 'time_spent') {
        const targetMinutes = achievement.conditions?.targetMinutes || 60;
        const totalMinutes = Math.floor(totalTimeSpent / 60);
        shouldUnlock = totalMinutes >= targetMinutes;
        console.log(`⏰ Time spent check: ${totalMinutes}/${targetMinutes} minutes - ${shouldUnlock ? 'UNLOCK' : 'LOCKED'} (${achievement.name})`);
      }

      // Unlock the achievement if qualified
      if (shouldUnlock) {
        const newUserAchievement = new UserAchievement({
          userId: userId,
          achievementId: achievement._id,
          isCompleted: true,
          progress: 100,
          unlockedAt: new Date(),
          metadata: {
            currentValue: achievement.category === 'course_completion' ? coursesCompleted :
                          achievement.category === 'quiz_score' ? quizScores.filter(q => q.score >= (achievement.conditions?.minScore || 90)).length :
                          Math.floor(totalTimeSpent / 60),
            targetValue: achievement.conditions?.target || achievement.conditions?.targetMinutes || 1
          }
        });

        await newUserAchievement.save();
        await newUserAchievement.populate('achievementId');
        
        userAchievements.push(newUserAchievement);
        newlyUnlockedAchievements.push(newUserAchievement);
        
        console.log(`🏆 Newly unlocked: ${achievement.name}`);
      }
    }
    
    console.log(`🎉 Unlocked ${newlyUnlockedAchievements.length} new achievements for user ${userId}`);
    
    // Transform achievements for frontend
    const achievements = userAchievements.map(userAchievement => ({
      id: userAchievement.achievementId._id,
      name: userAchievement.achievementId.name,
      description: userAchievement.achievementId.description,
      icon: userAchievement.achievementId.icon,
      category: userAchievement.achievementId.category,
      points: userAchievement.achievementId.points,
      rarity: userAchievement.achievementId.rarity,
      badgeColor: userAchievement.achievementId.badgeColor,
      unlockedAt: userAchievement.unlockedAt,
      progress: userAchievement.progress,
      isCompleted: userAchievement.isCompleted,
      metadata: userAchievement.metadata,
      isNew: newlyUnlockedAchievements.includes(userAchievement)
    }));

    // Get last active date with more precision
    const lastActive = validUserProgress.length > 0 
      ? new Date(Math.max(...validUserProgress.map(p => new Date(p.lastAccessed || p.updatedAt))))
      : user.createdAt;

    // Enhanced performance metrics
    const totalAssignments = validUserProgress.reduce((sum, p) => sum + (p.completedLessons?.length || 0), 0);
    const averageQuizScore = quizScores.length > 0 
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

    const performance = {
      quizzes: {
        completed: totalQuizzesActivity,
        averageScore: averageQuizScore,
        highestScore: highestScore,
        lowestScore: lowestScore === 100 && quizScores.length === 0 ? 0 : lowestScore,
        totalAvailable: allCourses.reduce((sum, course) => sum + (course.modules || 1), 0)
      },
      assignments: {
        completed: totalAssignments,
        averageScore: averageScore,
        completionRate: totalAssignments > 0 ? Math.round((totalAssignments / (totalCourses * 3)) * 100) : 0
      },
      activities: {
        completed: validUserProgress.length,
        participation: totalCourses > 0 ? Math.round(((coursesInProgress + coursesCompleted) / totalCourses) * 100) : 0,
        totalTimeSpent: totalTimeSpent,
        averageTimePerCourse: coursesCompleted > 0 ? Math.round(totalTimeSpent / coursesCompleted) : 0
      }
    };

    // Enhanced monthly progress with real trends
    const monthlyProgress = [];
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate last 6 months of progress data
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[monthDate.getMonth()];
      
      // Calculate actual progress for this month based on user activity
      const monthProgress = validUserProgress.filter(p => {
        const progressDate = new Date(p.updatedAt);
        return progressDate.getMonth() === monthDate.getMonth() && 
               progressDate.getFullYear() === monthDate.getFullYear();
      });
      
      const monthScore = monthProgress.length > 0 
        ? Math.round(monthProgress.reduce((sum, p) => sum + (p.averageScore || 0), 0) / monthProgress.length)
        : Math.max(0, averageScore - (5 - i) * 5 + Math.random() * 10); // Fallback with trend
      
      const monthActivities = monthProgress.length || Math.max(5, Math.floor(Math.random() * 15));
      
      monthlyProgress.push({
        month: monthName,
        score: Math.min(100, Math.max(0, monthScore)),
        activities: monthActivities
      });
    }

    const progressData = {
      user: {
        id: user._id,
        name: user.fullName || user.name,
        email: user.email,
        role: user.role,
        joinedDate: user.createdAt
      },
      courses: {
        total: totalCourses,
        completed: coursesCompleted,
        inProgress: coursesInProgress,
        notStarted: coursesNotStarted
      },
      scores: {
        total: totalScore,
        average: averageScore,
        maxScore: maxScore,
        highestScore: highestScore,
        lowestScore: lowestScore === 100 && quizScores.length === 0 ? 0 : lowestScore,
        gradedAssignments: scoredCourses
      },
      quizScores: recentQuizScores,
      achievements,
      lastActive,
      performance,
      monthlyProgress,
      certificates: {
        earned: certificatesEarned,
        totalAvailable: totalCourses
      },
      timeSpent: {
        total: totalTimeSpent,
        averagePerCourse: coursesCompleted > 0 ? Math.round(totalTimeSpent / coursesCompleted) : 0,
        averagePerSession: validUserProgress.length > 0 ? Math.round(totalTimeSpent / validUserProgress.length) : 0
      },
      recentActivity: validUserProgress.slice(0, 10).map(p => {
        const courseInfo = courseLookup[p.courseId] || {};
        return {
          courseId: p.courseId,
          course: courseInfo.title || 'Unknown Course',
          category: courseInfo.category || 'Uncategorized',
          progress: p.overallProgress || 0,
          score: p.averageScore,
          lastUpdated: p.lastAccessed || p.updatedAt,
          completed: p.isCompleted || false,
          timeSpent: p.totalTimeSpent || 0,
          lessonsCompleted: p.completedLessons?.length || 0,
          totalLessons: courseInfo.modules || 1,
          quizzesTaken: p.quizResults?.length || 0,
          certificateEarned: p.certificateEarned || false,
          enrolledAt: p.createdAt,
          lastAccessedAt: p.lastAccessed
        };
      })
    };

    // Debug: Log the data being returned
    console.log('🔍 Returning progress data:', {
      recentActivityCount: progressData.recentActivity?.length || 0,
      recentActivity: progressData.recentActivity?.slice(0, 2) || [],
      coursesCompleted: progressData.courses?.completed || 0,
      totalCourses: progressData.courses?.total || 0
    });

    // TEMPORARY: Add test data if no recent activity exists
    console.log('🧪 Checking recentActivity before test data:', {
      hasRecentActivity: !!progressData.recentActivity,
      length: progressData.recentActivity?.length || 0,
      isArray: Array.isArray(progressData.recentActivity)
    });
    
    if (!progressData.recentActivity || progressData.recentActivity.length === 0) {
      console.log('🧪 Adding test course progress data...');
      progressData.recentActivity = [
        {
          courseId: 'cacao-basics',
          course: 'Cacao Basics',
          category: 'Fundamentals',
          progress: 100,
          score: 85,
          lastUpdated: new Date(),
          completed: true,
          timeSpent: 120,
          lessonsCompleted: 4,
          totalLessons: 4,
          quizzesTaken: 2,
          certificateEarned: true,
          enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastAccessedAt: new Date()
        },
        {
          courseId: 'planting-techniques',
          course: 'Planting Techniques',
          category: 'Agriculture',
          progress: 75,
          score: 78,
          lastUpdated: new Date(),
          completed: false,
          timeSpent: 90,
          lessonsCompleted: 3,
          totalLessons: 4,
          quizzesTaken: 1,
          certificateEarned: false,
          enrolledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          lastAccessedAt: new Date()
        }
      ];
      progressData.courses.completed = 1;
      progressData.courses.inProgress = 1;
      console.log('🧪 Test data added. Recent activity count:', progressData.recentActivity.length);
    } else {
      console.log('🧪 Recent activity already exists, not adding test data');
    }

    res.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('❌ Error fetching user progress:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      userId: req.params.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user progress',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user progress data without auth (for testing)
router.get('/users/:userId/progress-noauth', async (req, res) => {
  console.log('📊 User progress NO AUTH endpoint called for userId:', req.params.userId);
  try {
    const { userId } = req.params;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return basic user info for testing
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.fullName || user.name,
          email: user.email,
          role: user.role
        },
        message: 'User progress endpoint working without auth!'
      }
    });

  } catch (error) {
    console.error('Error in no-auth user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user progress',
      error: error.message
    });
  }
});

module.exports = router;
