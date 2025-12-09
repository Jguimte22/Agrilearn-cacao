require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Notification = require('./models/Notification');

const deleteUndefinedNotifications = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find notifications with "undefined" in the message
    const undefinedNotifications = await Notification.find({
      message: { $regex: /undefined/i }
    });

    console.log(`Found ${undefinedNotifications.length} notifications with "undefined"`);

    if (undefinedNotifications.length > 0) {
      // Delete them
      const result = await Notification.deleteMany({
        message: { $regex: /undefined/i }
      });

      console.log(`✅ Deleted ${result.deletedCount} notifications with "undefined"`);
    } else {
      console.log('No notifications with "undefined" found');
    }

    // Show remaining notifications
    const remaining = await Notification.countDocuments();
    console.log(`Remaining notifications in database: ${remaining}`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

deleteUndefinedNotifications();
