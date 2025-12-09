const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Admin = require('../models/Admin');

const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.startsWith('--email='));
const passwordArg = args.find(arg => arg.startsWith('--password='));

if (!emailArg || !passwordArg) {
  console.error('\nUsage: node scripts/resetAdminPassword.js --email=admin@agrilearn.com --password=admin123\n');
  process.exit(1);
}

const email = emailArg.split('=')[1]?.trim().toLowerCase();
const newPassword = passwordArg.split('=')[1];

if (!email || !newPassword) {
  console.error('Both email and password must be provided.');
  process.exit(1);
}

(async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      console.error(`Admin with email ${email} not found.`.red);
      process.exit(1);
    }

    admin.password = newPassword;
    admin.isActive = true;
    await admin.save();

    console.log(`\n✅ Password for ${admin.email} has been reset successfully.`.green.bold);
    console.log('You can now log in with the new password provided.');
  } catch (error) {
    console.error('\n❌ Failed to reset admin password:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
