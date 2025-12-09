const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const userAuth = require('../middleware/userAuth');
const mongoose = require('mongoose');

// Get user notifications
router.get('/', userAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    console.log('=== Fetching Notifications ===');
    console.log('User ID:', req.user.id);
    console.log('User ID type:', typeof req.user.id);
    console.log('User info:', req.user);
    console.log('Query params:', { page, limit, unreadOnly });

    // Handle both string and ObjectId user IDs
    let userId = req.user.id;
    if (typeof userId === 'string') {
      try {
        // Try to convert to ObjectId if it looks like one
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
          userId = new mongoose.Types.ObjectId(userId);
        }
      } catch (e) {
        // Keep as string if conversion fails
      }
    }

    console.log('Final user ID for query:', userId);
    console.log('Final user ID type:', typeof userId);

    let query = { userId: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    console.log('Database query:', query);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found notifications:', notifications.length);
    if (notifications.length > 0) {
      console.log('Sample notification:', notifications[0]);
    }

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: userId,
      isRead: false
    });

    console.log('Total notifications:', total);
    console.log('Unread count:', unreadCount);

    res.json({
      notifications,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', userAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        userId: req.user.id
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', userAuth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
});

// Delete notification
router.delete('/:notificationId', userAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// Delete all read notifications
router.delete('/read-all', userAuth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user.id,
      isRead: true
    });

    res.json({
      message: 'All read notifications deleted',
      count: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ message: 'Error deleting read notifications' });
  }
});

// Get notification settings/preferences
router.get('/settings', userAuth, async (req, res) => {
  try {
    // This would typically come from a user preferences model
    // For now, return default settings
    res.json({
      emailNotifications: true,
      pushNotifications: true,
      courseUpdates: true,
      achievementAlerts: true,
      certificateAlerts: true
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Error fetching notification settings' });
  }
});

// Update notification settings
router.patch('/settings', userAuth, async (req, res) => {
  try {
    const settings = req.body;
    // This would typically update a user preferences model
    // For now, just return the updated settings
    res.json({
      message: 'Notification settings updated',
      settings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Error updating notification settings' });
  }
});

// Create custom notification (for testing or admin use)
router.post('/create', userAuth, async (req, res) => {
  try {
    const { title, message, type, priority, actionUrl, actionText } = req.body;
    
    console.log('Creating notification for user:', req.user.id);
    console.log('Notification data:', { title, message, type, priority });
    
    const notification = new Notification({
      userId: req.user.id,
      title,
      message,
      type: type || 'system',
      priority: priority || 'medium',
      actionUrl,
      actionText
    });

    const savedNotification = await notification.save();
    console.log('Notification saved:', savedNotification._id);
    
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification' });
  }
});

// Test endpoint to create a sample notification
router.post('/test-create', userAuth, async (req, res) => {
  try {
    console.log('Creating test notification for user:', req.user.id);
    
    const notification = new Notification({
      userId: req.user.id,
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      type: 'system',
      priority: 'medium',
      icon: '🔔'
    });

    const savedNotification = await notification.save();
    console.log('Test notification created:', savedNotification._id);
    
    res.status(201).json({
      message: 'Test notification created successfully',
      notification: savedNotification
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ message: 'Error creating test notification' });
  }
});

// Debug endpoint to see all notifications (for debugging)
router.get('/debug/all', async (req, res) => {
  try {
    console.log('=== DEBUG: All Notifications in Database ===');
    
    const allNotifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10); // Limit to last 10 for debugging
    
    console.log('Total notifications in database:', await Notification.countDocuments());
    console.log('Sample notifications:', allNotifications.map(n => ({
      id: n._id,
      userId: n.userId,
      title: n.title,
      type: n.type,
      createdAt: n.createdAt
    })));
    
    res.json({
      total: await Notification.countDocuments(),
      notifications: allNotifications
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: 'Debug endpoint error' });
  }
});

// Debug endpoint to see current user info
router.get('/debug/user', userAuth, async (req, res) => {
  try {
    console.log('=== DEBUG: Current User Info ===');
    console.log('User ID:', req.user.id);
    console.log('User info:', req.user);
    console.log('User type:', typeof req.user.id);
    
    // Count notifications for this user
    const userNotificationCount = await Notification.countDocuments({ userId: req.user.id });
    console.log('Notifications count for this user:', userNotificationCount);
    
    // Get sample notifications for this user
    const userNotifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(3);
    
    res.json({
      user: {
        id: req.user.id,
        type: typeof req.user.id,
        info: req.user
      },
      notificationCount: userNotificationCount,
      sampleNotifications: userNotifications
    });
  } catch (error) {
    console.error('Debug user endpoint error:', error);
    res.status(500).json({ message: 'Debug user endpoint error' });
  }
});

module.exports = router;
