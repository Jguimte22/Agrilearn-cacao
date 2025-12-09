// Unlock achievements for users with completed courses
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const { Achievement, UserAchievement } = require('./models/Achievement');
const CourseProgress = require('./models/CourseProgress');
const User = require('./models/User');

async function unlockAchievements() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users\n`);

    let totalUnlocked = 0;

    for (const user of users) {
      console.log(`\n=== Processing user: ${user.email || user.name}`);

      // Get user's completed courses
      const completedCourses = await CourseProgress.find({
        userId: user._id,
        isCompleted: true
      });

      console.log(`   Completed courses: ${completedCourses.length}`);

      if (completedCourses.length > 0) {
        // Get course completion achievements
        const courseAchievements = await Achievement.find({
          category: 'course_completion',
          isActive: true
        }).sort({ 'conditions.target': 1 });

        console.log(`   Course achievements available: ${courseAchievements.length}`);

        for (const achievement of courseAchievements) {
          const target = achievement.conditions?.target || 1;

          if (completedCourses.length >= target) {
            // Check if already unlocked
            const existing = await UserAchievement.findOne({
              userId: user._id,
              achievementId: achievement._id,
              isCompleted: true
            });

            if (!existing) {
              // Unlock achievement
              await UserAchievement.findOneAndUpdate(
                { userId: user._id, achievementId: achievement._id },
                {
                  userId: user._id,
                  achievementId: achievement._id,
                  progress: 100,
                  isCompleted: true,
                  unlockedAt: new Date(),
                  metadata: {
                    currentValue: completedCourses.length,
                    targetValue: target
                  }
                },
                { upsert: true, new: true }
              );

              console.log(`   ✅ Unlocked: ${achievement.name} (${completedCourses.length}/${target} courses)`);
              totalUnlocked++;
            } else {
              console.log(`   ⏭️  Already unlocked: ${achievement.name}`);
            }
          }
        }
      }
    }

    // Show final statistics
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Total achievements unlocked: ${totalUnlocked}`);

    const allUserAchievements = await UserAchievement.countDocuments({ isCompleted: true });
    console.log(`📊 Total user achievements in database: ${allUserAchievements}`);
    console.log('='.repeat(50));

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

unlockAchievements();
