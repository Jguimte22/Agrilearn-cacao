const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['course_completion', 'quiz_score', 'streak', 'time_spent', 'social', 'special'],
    required: true
  },
  type: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'automatic'
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  badgeColor: {
    type: String,
    default: '#8B5A2B'
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  metadata: {
    currentValue: {
      type: mongoose.Schema.Types.Mixed,
      default: 0
    },
    targetValue: {
      type: mongoose.Schema.Types.Mixed,
      default: 0
    },
    relatedCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    relatedQuizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
userAchievementSchema.index({ userId: 1, isCompleted: 1 });
userAchievementSchema.index({ userId: 1, unlockedAt: -1 });
userAchievementSchema.index({ achievementId: 1 });

// Static method to check and unlock achievements
userAchievementSchema.statics.checkAchievements = async function(userId, action, data) {
  const achievements = await mongoose.model('Achievement').find({ isActive: true });
  const unlockedAchievements = [];

  for (const achievement of achievements) {
    // Check if user already has this achievement
    const existingUserAchievement = await this.findOne({
      userId,
      achievementId: achievement._id,
      isCompleted: true
    });

    if (existingUserAchievement) continue;

    // Check if conditions are met
    const isUnlocked = await this.checkConditions(achievement, action, data);
    
    if (isUnlocked) {
      // Create or update user achievement
      const userAchievement = await this.findOneAndUpdate(
        { userId, achievementId: achievement._id },
        {
          isCompleted: true,
          progress: 100,
          unlockedAt: new Date(),
          metadata: {
            currentValue: data.currentValue || 0,
            targetValue: achievement.conditions.target || 0,
            relatedQuizId: data.quizId
            // relatedCourseId: data.courseId - Removed since courseId is string but schema expects ObjectId
          }
        },
        { upsert: true, new: true }
      ).populate('achievementId');

      unlockedAchievements.push(userAchievement);
    }
  }

  return unlockedAchievements;
};

// Helper method to check achievement conditions
userAchievementSchema.statics.checkConditions = async function(achievement, action, data) {
  const { conditions } = achievement;
  
  switch (achievement.category) {
    case 'course_completion':
      if (action === 'course_completed') {
        return data.coursesCompleted >= (conditions.target || 1);
      }
      break;
      
    case 'quiz_score':
      if (action === 'quiz_completed') {
        return data.score >= (conditions.minScore || 80);
      }
      break;
      
    case 'streak':
      if (action === 'daily_login') {
        return data.streakDays >= (conditions.target || 7);
      }
      break;
      
    case 'time_spent':
      if (action === 'lesson_completed') {
        return data.totalTimeSpent >= (conditions.targetMinutes || 60);
      }
      break;
      
    default:
      return false;
  }
  
  return false;
};

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = { Achievement, UserAchievement };
