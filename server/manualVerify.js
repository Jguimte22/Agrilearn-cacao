const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: '../.env' });

const manualVerifyUser = async (email) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('❌ No user found with email:', email);
            process.exit(1);
        }

        console.log('\n📧 User found:', {
            name: `${user.firstName} ${user.surname}`,
            email: user.email,
            userRole: user.userRole,
            emailVerified: user.emailVerified
        });

        // Check if already verified
        if (user.emailVerified) {
            console.log('✅ Email is already verified! You can log in now.');
            process.exit(0);
        }

        // Manually verify the user
        user.emailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        console.log('\n✅ Email manually verified successfully!');
        console.log('🎉 You can now log in to your account!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node manualVerify.js <email>');
    console.log('Example: node manualVerify.js user@gmail.com');
    console.log('\nThis will manually verify the user account without needing to click the email link.');
    process.exit(1);
}

manualVerifyUser(email);
