require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const { Achievement, UserAchievement } = require('./models/Achievement');
    const User = require('./models/User');

    // Find the user by name
    const user = await User.findOne({ name: /Kristofer/i });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log(`\nChecking achievements for user: ${user.name} (${user._id})`);
    console.log('='.repeat(80));

    // Get user's unlocked achievements
    const userAchievements = await UserAchievement.find({
      userId: user._id,
      isCompleted: true
    }).populate('achievementId');

    console.log(`\nUnlocked achievements: ${userAchievements.length}`);
    userAchievements.forEach(ua => {
      console.log(`  ✅ ${ua.achievementId?.name || 'Unknown'} - Unlocked at: ${ua.unlockedAt}`);
    });

    // Get all user achievement records
    const allUserAchievements = await UserAchievement.find({
      userId: user._id
    }).populate('achievementId');

    console.log(`\nAll user achievement records: ${allUserAchievements.length}`);
    allUserAchievements.forEach(ua => {
      console.log(`  ${ua.isCompleted ? '✅' : '❌'} ${ua.achievementId?.name || 'Unknown'} - Progress: ${ua.progress}%`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
