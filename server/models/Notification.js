const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['course_completion', 'quiz_passed', 'achievement_unlocked', 'certificate_earned', 'reminder', 'system'],
    required: true
  },
  icon: {
    type: String,
    default: '🔔'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: {
    type: String // Link to redirect when notification is clicked
  },
  actionText: {
    type: String // Text for action button
  },
  metadata: {
    courseId: {
      type: String  // Changed from ObjectId to String to support string course IDs like 'gap-practices'
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate'
    },
    score: {
      type: Number
    },
    progress: {
      type: Number
    }
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notifications
notificationSchema.statics.createNotification = async function(userId, type, title, message, metadata = {}) {
  const icons = {
    course_completion: '🎓',
    quiz_passed: '✅',
    achievement_unlocked: '🏆',
    certificate_earned: '📜',
    new_course: '📚',
    reminder: '⏰',
    system: '🔔'
  };

  const notification = new this({
    userId,
    type,
    title,
    message,
    icon: icons[type] || '🔔',
    metadata,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });

  return await notification.save();
};

// Static method to create course completion notification
notificationSchema.statics.createCourseCompletionNotification = async function(userId, courseId, courseTitle, score) {
  return await this.createNotification(
    userId,
    'course_completion',
    'Course Completed! 🎉',
    `Congratulations! You have successfully completed "${courseTitle}" with a score of ${score}%.`,
    {
      courseId,
      score,
      actionUrl: `/courses/${courseId}/certificate`,
      actionText: 'View Certificate'
    }
  );
};

// Static method to create achievement unlocked notification
notificationSchema.statics.createAchievementNotification = async function(userId, achievementName, achievementIcon) {
  return await this.createNotification(
    userId,
    'achievement_unlocked',
    'Achievement Unlocked! 🏆',
    `Congratulations! You've unlocked the "${achievementName}" achievement.`,
    {
      actionUrl: '/achievements',
      actionText: 'View Achievements'
    }
  );
};

// Static method to create certificate earned notification
notificationSchema.statics.createCertificateNotification = async function(userId, courseTitle, certificateId) {
  return await this.createNotification(
    userId,
    'certificate_earned',
    'Certificate Earned! 📜',
    `Your certificate for completing "${courseTitle}" is now available.`,
    {
      certificateId,
      actionUrl: `/certificates/${certificateId}`,
      actionText: 'View Certificate'
    }
  );
};

// Static method to create new course notification for active users (exclude very new users)
notificationSchema.statics.createNewCourseNotification = async function(courseId, courseTitle, courseDescription) {
  try {
    console.log('createNewCourseNotification called with:', { courseId, courseTitle, courseDescription });
    
    const User = require('./User');
    
    // Get only users who have been active for more than 1 day
    // This prevents notifying brand new users who haven't started yet
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const users = await User.find({ 
      isActive: true,
      createdAt: { $lt: oneDayAgo } // Only users created more than 24 hours ago
    }).select('_id');
    console.log('Found active users (older than 24 hours):', users.length);
    
    if (users.length === 0) {
      console.log('No eligible active users found for notifications');
      return [];
    }
    
    // Create notifications for eligible users
    const notifications = users.map(user => ({
      userId: user._id,
      type: 'new_course',
      title: 'New Course Available! 📚',
      message: `Check out our new course: "${courseTitle}". ${courseDescription.substring(0, 100)}${courseDescription.length > 100 ? '...' : ''}`,
      icon: '📚',
      priority: 'medium',
      metadata: {
        courseId
      },
      actionUrl: `/courses/${courseId}`,
      actionText: 'View Course',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }));

    console.log('Prepared notifications for eligible users:', notifications.length);

    // Bulk insert notifications
    const result = await this.insertMany(notifications);
    console.log(`Successfully created new course notifications for ${users.length} eligible users`);
    return result;
  } catch (error) {
    console.error('Error creating new course notifications:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

module.exports = mongoose.model('Notification', notificationSchema);
