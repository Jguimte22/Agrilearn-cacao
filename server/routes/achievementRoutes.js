const express = require('express');
const router = express.Router();
const { Achievement, UserAchievement } = require('../models/Achievement');
const Notification = require('../models/Notification');
const userAuth = require('../middleware/userAuth');
const mongoose = require('mongoose');

// Seed achievements if they don't exist
router.post('/setup', userAuth, async (req, res) => {
  try {
    console.log('Setting up achievements...');
    
    // Check if achievements already exist
    const existingCount = await Achievement.countDocuments();
    if (existingCount > 0) {
      console.log('Achievements already exist:', existingCount);
      return res.json({ message: 'Achievements already exist', count: existingCount });
    }
    
    // Import the seed function
    const seedAchievements = require('../utils/seedAchievements');
    const achievements = await seedAchievements();
    
    console.log('Achievements seeded successfully:', achievements.length);
    res.json({ 
      message: 'Achievements seeded successfully', 
      count: achievements.length 
    });
  } catch (error) {
    console.error('Error setting up achievements:', error);
    res.status(500).json({ message: 'Error setting up achievements', error: error.message });
  }
});

// Get all achievements (for admin or display)
router.get('/', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 Fetching achievements for user:', userId);

    // Get all achievements
    const allAchievements = await Achievement.find({ isActive: true })
      .sort({ sortOrder: 1, rarity: 1 });
    console.log('📊 Total achievements in DB:', allAchievements.length);

    // Get user's achievement progress
    const userAchievements = await UserAchievement.find({ userId })
      .populate('achievementId');
    console.log('📊 User achievements found:', userAchievements.length);

    // Create a map of achievement progress
    const progressMap = new Map();
    userAchievements.forEach(ua => {
      if (ua.achievementId) {
        console.log(`📊 Mapping: ${ua.achievementId.name} - Completed: ${ua.isCompleted}`);
        progressMap.set(ua.achievementId._id.toString(), {
          progress: ua.progress,
          isCompleted: ua.isCompleted,
          unlockedAt: ua.unlockedAt
        });
      }
    });

    // Merge achievements with user progress
    const achievements = allAchievements.map(achievement => {
      const userProgress = progressMap.get(achievement._id.toString());
      const unlocked = userProgress?.isCompleted || false;
      return {
        ...achievement.toObject(),
        unlocked: unlocked,
        progress: userProgress?.progress || 0,
        unlockedAt: userProgress?.unlockedAt || null
      };
    });

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    console.log('📊 Sending achievements - Total:', achievements.length, 'Unlocked:', unlockedCount);

    res.json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements' });
  }
});

// Get user's achievements
router.get('/user', userAuth, async (req, res) => {
  try {
    console.log('📊 Fetching achievements for user:', req.user.id);

    const userAchievements = await UserAchievement.find({ userId: req.user.id })
      .populate('achievementId')
      .sort({ unlockedAt: -1 });

    console.log('📊 Found user achievement records:', userAchievements.length);

    // Separate locked and unlocked achievements
    const unlocked = userAchievements.filter(ua => ua.isCompleted);
    console.log('📊 Unlocked achievements:', unlocked.length);
    unlocked.forEach(ua => {
      console.log('  ✅', ua.achievementId?.name || 'Unknown');
    });

    const unlockedIds = unlocked.map(ua => ua.achievementId._id.toString());

    const allAchievements = await Achievement.find({ isActive: true });
    console.log('📊 Total achievements in DB:', allAchievements.length);

    const locked = allAchievements.filter(a => !unlockedIds.includes(a._id.toString()));
    console.log('📊 Locked achievements:', locked.length);

    res.json({
      unlocked: unlocked,
      locked: locked,
      totalUnlocked: unlocked.length,
      totalAvailable: allAchievements.length
    });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ message: 'Error fetching user achievements' });
  }
});

// Get achievement progress details
router.get('/progress/:achievementId', userAuth, async (req, res) => {
  try {
    const userAchievement = await UserAchievement.findOne({
      userId: req.user.id,
      achievementId: req.params.achievementId
    }).populate('achievementId');

    if (!userAchievement) {
      // Create new user achievement record
      const achievement = await Achievement.findById(req.params.achievementId);
      if (!achievement) {
        return res.status(404).json({ message: 'Achievement not found' });
      }

      const newUserAchievement = new UserAchievement({
        userId: req.user.id,
        achievementId: req.params.achievementId,
        progress: 0,
        isCompleted: false,
        metadata: {
          currentValue: 0,
          targetValue: achievement.conditions.target || 0
        }
      });

      await newUserAchievement.save();
      return res.json(newUserAchievement);
    }

    res.json(userAchievement);
  } catch (error) {
    console.error('Error fetching achievement progress:', error);
    res.status(500).json({ message: 'Error fetching achievement progress' });
  }
});

// Create default achievements (for initial setup)
router.post('/setup', userAuth, async (req, res) => {
  try {
    // Check if achievements already exist
    const existingCount = await Achievement.countDocuments();
    if (existingCount > 0) {
      return res.json({ message: 'Achievements already set up' });
    }

    const defaultAchievements = [
      {
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
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

    await Achievement.insertMany(defaultAchievements);

    res.json({ 
      message: 'Default achievements created successfully',
      count: defaultAchievements.length
    });
  } catch (error) {
    console.error('Error setting up achievements:', error);
    res.status(500).json({ message: 'Error setting up achievements' });
  }
});

// Manual achievement unlock (for admin)
router.post('/unlock/:achievementId', userAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const targetUserId = userId || req.user.id;

    const userAchievement = await UserAchievement.findOneAndUpdate(
      { userId: targetUserId, achievementId: req.params.achievementId },
      {
        isCompleted: true,
        progress: 100,
        unlockedAt: new Date()
      },
      { upsert: true, new: true }
    ).populate('achievementId');

    // Create notification
    await Notification.createAchievementNotification(
      targetUserId,
      userAchievement.achievementId.name,
      userAchievement.achievementId.icon
    );

    res.json({
      message: 'Achievement unlocked successfully',
      achievement: userAchievement
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    res.status(500).json({ message: 'Error unlocking achievement' });
  }
});

// Get achievement statistics
router.get('/stats', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await UserAchievement.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalUnlocked: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          totalPoints: { $sum: '$achievementId.points' },
          byCategory: {
            $push: {
              category: '$achievementId.category',
              isCompleted: '$isCompleted'
            }
          },
          byRarity: {
            $push: {
              rarity: '$achievementId.rarity',
              isCompleted: '$isCompleted'
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalUnlocked: 0,
      totalPoints: 0,
      byCategory: [],
      byRarity: []
    };

    // Get recent unlocks
    const recentUnlocks = await UserAchievement.find({ 
      userId, 
      isCompleted: true 
    })
      .populate('achievementId', 'name icon rarity')
      .sort({ unlockedAt: -1 })
      .limit(5);

    res.json({
      ...result,
      recentUnlocks
    });

  } catch (error) {
    console.error('Error fetching achievement stats:', error);
    res.status(500).json({ message: 'Error fetching achievement statistics' });
  }
});

// Simple test endpoint
router.post('/test', userAuth, async (req, res) => {
  try {
    console.log('🧪 Test endpoint called');
    const userId = req.user.id;
    console.log('🧪 User ID:', userId);
    
    res.json({ 
      success: true, 
      message: 'Test endpoint works!',
      userId: userId 
    });
  } catch (error) {
    console.error('🧪 Test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test endpoint failed',
      error: error.message 
    });
  }
});

// Manual unlock first achievement for testing
router.post('/unlock-first', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔓 Manually unlocking first achievement for user:', userId);

    const { Achievement, UserAchievement } = require('../models/Achievement');
    
    // Get first achievement
    const firstAchievement = await Achievement.findOne({ isActive: true });
    
    if (!firstAchievement) {
      return res.json({ success: false, message: 'No achievements found' });
    }

    // Check if already unlocked
    const existing = await UserAchievement.findOne({ 
      userId, 
      achievementId: firstAchievement._id 
    });

    if (existing && existing.isCompleted) {
      return res.json({ success: true, message: 'Already unlocked' });
    }

    // Unlock the achievement
    await UserAchievement.findOneAndUpdate(
      { userId, achievementId: firstAchievement._id },
      {
        isCompleted: true,
        progress: 100,
        unlockedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`🏆 Manually unlocked: ${firstAchievement.name}`);
    
    res.json({
      success: true,
      message: 'Achievement unlocked!',
      achievement: {
        id: firstAchievement._id,
        name: firstAchievement.name,
        description: firstAchievement.description,
        icon: firstAchievement.icon
      }
    });

  } catch (error) {
    console.error('❌ Error unlocking achievement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error unlocking achievement',
      error: error.message 
    });
  }
});

// Check and unlock achievements based on user progress
router.post('/check-progress', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Checking achievements for user:', userId);

    // Import models
    const CourseProgress = require('../models/CourseProgress');
    const QuizScore = require('../models/QuizScore');
    const { Achievement, UserAchievement } = require('../models/Achievement');

    // Get user stats
    const courseProgress = await CourseProgress.find({ userId });
    const completedCourses = courseProgress.filter(cp => cp.isCompleted || cp.overallProgress >= 100).length;
    
    const quizScores = await QuizScore.find({ userId });
    const perfectScores = quizScores.filter(qs => qs.score === 100).length;
    
    console.log(`📊 User stats: ${completedCourses} courses completed, ${perfectScores} perfect scores`);

    // Get all achievements
    const allAchievements = await Achievement.find({ isActive: true });

    if (!allAchievements || allAchievements.length === 0) {
      console.log('❌ No achievements found in database');
      return res.json({ success: false, message: 'No achievements available' });
    }

    console.log(`🏆 Found ${allAchievements.length} achievements to check`);

    // Track newly unlocked achievements
    const newlyUnlocked = [];

    // Check each achievement
    for (const achievement of allAchievements) {
      // Check if user already has this achievement
      const existing = await UserAchievement.findOne({
        userId,
        achievementId: achievement._id
      });

      if (existing && existing.isCompleted) {
        console.log(`✅ Already unlocked: ${achievement.name}`);
        continue;
      }

      // Check if user qualifies for this achievement
      let shouldUnlock = false;

      if (achievement.category === 'course_completion') {
        const target = achievement.conditions?.target || 1;

        // Handle "all" target
        const targetNumber = target === 'all' ? 7 : parseInt(target);

        // Check if there's a timeframe condition
        if (achievement.conditions?.timeframe) {
          // For now, just check the total courses (timeframe checking requires complex date logic)
          shouldUnlock = completedCourses >= targetNumber;
          console.log(`📊 Course completion check (with timeframe): ${completedCourses}/${targetNumber} - ${shouldUnlock ? 'UNLOCK' : 'LOCKED'}`);
        } else {
          shouldUnlock = completedCourses >= targetNumber;
          console.log(`📊 Course completion check: ${completedCourses}/${targetNumber} - ${shouldUnlock ? 'UNLOCK' : 'LOCKED'}`);
        }
      } else if (achievement.category === 'quiz_score') {
        // Check if it's based on total score or number of high scores
        if (achievement.conditions?.target && !achievement.conditions?.minScore) {
          // Total score across all quizzes
          const totalScore = quizScores.reduce((sum, qs) => sum + (qs.score || 0), 0);
          shouldUnlock = totalScore >= achievement.conditions.target;
          console.log(`📊 Total quiz score check: ${totalScore}/${achievement.conditions.target} - ${shouldUnlock ? 'UNLOCK' : 'LOCKED'}`);
        } else if (achievement.conditions?.minScore) {
          // Number of quizzes with minimum score
          const target = achievement.conditions?.target || 1;
          const minScore = achievement.conditions?.minScore || 90;
          const highScores = quizScores.filter(qs => qs.score >= minScore).length;
          shouldUnlock = highScores >= target;
          console.log(`📊 Quiz score check: ${highScores}/${target} (min ${minScore}%) - ${shouldUnlock ? 'UNLOCK' : 'LOCKED'}`);
        }
      } else if (achievement.category === 'time_spent') {
        // Skip time-based achievements for now (requires tracking)
        console.log(`⏰ Time-based achievement skipped: ${achievement.name}`);
        continue;
      } else if (achievement.category === 'streak') {
        // Skip streak-based achievements for now (requires daily tracking)
        console.log(`🔥 Streak-based achievement skipped: ${achievement.name}`);
        continue;
      }

      // Unlock the achievement if qualified
      if (shouldUnlock) {
        await UserAchievement.findOneAndUpdate(
          { userId, achievementId: achievement._id },
          {
            isCompleted: true,
            progress: 100,
            unlockedAt: new Date()
          },
          { upsert: true, new: true }
        );

        console.log(`🏆 Unlocked: ${achievement.name}`);

        // Create notification
        try {
          await Notification.createAchievementNotification(
            userId,
            achievement.name,
            achievement.icon
          );
          console.log(`📧 Notification created for: ${achievement.name}`);
        } catch (notifError) {
          console.error('❌ Error creating notification:', notifError);
        }

        newlyUnlocked.push({
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon
        });
      }
    }

    if (newlyUnlocked.length > 0) {
      console.log(`🎉 Unlocked ${newlyUnlocked.length} new achievements!`);
      return res.json({
        success: true,
        message: `Unlocked ${newlyUnlocked.length} achievement(s)!`,
        newUnlocked: newlyUnlocked
      });
    } else {
      console.log('✅ No new achievements to unlock');
      return res.json({
        success: true,
        message: 'No new achievements to unlock',
        newUnlocked: []
      });
    }

  } catch (error) {
    console.error('❌ Error checking achievements:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking achievements',
      error: error.message 
    });
  }
});

module.exports = router;
