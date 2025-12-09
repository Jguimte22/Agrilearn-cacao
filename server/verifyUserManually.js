require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const verifyUserEmail = async (email) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find and update the user
        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null
            },
            { new: true }
        );

        if (!user) {
            console.log('❌ User not found with email:', email);
            process.exit(1);
        }

        console.log('✅ Email verified successfully for user:', {
            name: `${user.firstName} ${user.surname}`,
            email: user.email,
            emailVerified: user.emailVerified
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node verifyUserManually.js <email>');
    console.log('Example: node verifyUserManually.js sarmientokristoff1929@gmail.com');
    process.exit(1);
}

verifyUserEmail(email);
