require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const CourseProgress = require('./models/CourseProgress');
  const { Achievement, UserAchievement } = require('./models/Achievement');
  const Notification = require('./models/Notification');
  
  const userId = '692be41fef3abb020a4aa151';
  
  // Get user stats
  const courseProgress = await CourseProgress.find({ userId });
  const completedCourses = courseProgress.filter(cp => cp.isCompleted || cp.overallProgress >= 100).length;
  
  console.log('Completed courses:', completedCourses);
  
  // Check Quick Learner achievement
  const quickLearner = await Achievement.findOne({ name: 'Quick Learner' });
  if (quickLearner) {
    console.log('Quick Learner found:', quickLearner.name, 'Target:', quickLearner.conditions.target);
    
    const existing = await UserAchievement.findOne({ userId, achievementId: quickLearner._id });
    
    if (!existing || !existing.isCompleted) {
      if (completedCourses >= 2) {
        console.log('Unlocking Quick Learner...');
        
        await UserAchievement.findOneAndUpdate(
          { userId, achievementId: quickLearner._id },
          {
            isCompleted: true,
            progress: 100,
            unlockedAt: new Date()
          },
          { upsert: true, new: true }
        );
        
        await Notification.createAchievementNotification(userId, quickLearner.name, quickLearner.icon);
        
        console.log('✅ Quick Learner unlocked and notification created!');
      } else {
        console.log('User needs 2 courses, only has', completedCourses);
      }
    } else {
      console.log('Already unlocked');
    }
  }
  
  await mongoose.connection.close();
  process.exit(0);
})();
