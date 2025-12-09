const mongoose = require('mongoose');
const User = require('./models/User');
const { generateVerificationToken, generateTokenExpiry } = require('./utils/emailUtils');
const { sendVerificationEmail } = require('./services/emailService');
require('dotenv').config({ path: '../.env' });

const resendVerificationEmail = async (email) => {
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
            console.log('✅ Email is already verified!');
            process.exit(0);
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationExpires = generateTokenExpiry();

        // Update user with new token
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();

        console.log('🔑 New verification token generated');

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken, user.firstName);

        console.log('✅ Verification email sent successfully!');
        console.log('\n📬 Check your email for the verification link');
        console.log(`🔗 Or use this URL directly: ${process.env.FRONTEND_URL || 'http://localhost:3003'}/verify-email?token=${verificationToken}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node resendVerification.js <email>');
    console.log('Example: node resendVerification.js user@gmail.com');
    process.exit(1);
}

resendVerificationEmail(email);
