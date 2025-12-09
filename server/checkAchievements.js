require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const { Achievement } = require('./models/Achievement');

    const achievements = await Achievement.find({ isActive: true }).sort({ sortOrder: 1 });

    console.log('\nAll achievements in database:');
    console.log('='.repeat(80));
    achievements.forEach(a => {
      console.log(`Name: ${a.name}`);
      console.log(`  Category: ${a.category}`);
      console.log(`  Conditions: ${JSON.stringify(a.conditions)}`);
      console.log(`  Icon: ${a.icon}`);
      console.log('');
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
