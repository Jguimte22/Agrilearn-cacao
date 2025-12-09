const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

console.log('🔍 UserRoutes module loaded - lookup-email route should be registered');
const UserProfilePicture = require('../models/UserProfilePicture');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { generateFarmerEmail, isGmailAccount, generateVerificationToken, generateTokenExpiry } = require('../utils/emailUtils');
const { sendVerificationEmail, sendOTPEmail } = require('../services/emailService');
const { generateOTP, sendOTP, verifyOTP, formatPhoneNumberForDisplay } = require('../services/smsService');
const userAuth = require('../middleware/userAuth'); // Import userAuth middleware

// @route   POST api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        console.log('Received registration request:', req.body);

        const {
            firstName,
            middleName,
            surname,
            birthdate,
            userRole,
            email: providedEmail,
            password,
            ...rest
        } = req.body;

        // Validate required fields
        const requiredFields = [
            { field: 'firstName', name: 'First Name', value: firstName },
            { field: 'surname', name: 'Surname', value: surname },
            { field: 'birthdate', name: 'Birthdate', value: birthdate },
            { field: 'userRole', name: 'Role', value: userRole },
            { field: 'password', name: 'Password', value: password }
        ];

        for (const { name, value } of requiredFields) {
            if (!value || (typeof value === 'string' && !value.trim())) {
                return res.status(400).json({
                    success: false,
                    message: `${name} is required`
                });
            }
        }

        // Validate role
        if (!['farmer', 'student'].includes(userRole.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Please select Farmer or Student'
            });
        }

        // Validate birthdate
        const birthdateObj = new Date(birthdate);
        if (isNaN(birthdateObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid birthdate format'
            });
        }

        // Check age (must be at least 13 years old)
        const age = Math.floor((Date.now() - birthdateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 13) {
            return res.status(400).json({
                success: false,
                message: 'You must be at least 13 years old to register'
            });
        }

        let email;
        let emailVerified = false;
        let verificationToken = null;
        let verificationExpires = null;

        // Handle email based on role
        if (userRole.toLowerCase() === 'farmer') {
            // For farmers, validate provided email (no longer auto-generate)
            if (!providedEmail || !providedEmail.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required for farmers'
                });
            }

            // Allow any email domain for farmers (not restricted to Gmail)
            email = providedEmail.toLowerCase().trim();

            // Generate verification token for farmers (same as students)
            verificationToken = generateVerificationToken();
            verificationExpires = generateTokenExpiry();
            console.log('Farmer email requires verification:', email);
        } else {
            // For students, validate Gmail
            if (!providedEmail || !providedEmail.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required for students'
                });
            }

            if (!isGmailAccount(providedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Students must use a Gmail account'
                });
            }

            email = providedEmail.toLowerCase().trim();

            // Generate verification token for students
            verificationToken = generateVerificationToken();
            verificationExpires = generateTokenExpiry();
            console.log('Student email requires verification:', email);
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Prepare user data
        const userData = {
            firstName: firstName.trim(),
            middleName: middleName ? middleName.trim() : '',
            surname: surname.trim(),
            birthdate: birthdateObj,
            email,
            emailVerified,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
            password,
            userRole: userRole.toLowerCase(),
            ...rest
        };

        console.log('Creating user with data:', {
            ...userData,
            password: '***',
            emailVerificationToken: verificationToken ? '***' : null
        });

        // Create new user
        const user = new User(userData);

        try {
            // Save user to database (password will be hashed by pre-save hook)
            await user.save();
            console.log('User created successfully:', user._id);

            // Send verification email for both students and farmers
            if (userRole.toLowerCase() === 'student' || userRole.toLowerCase() === 'farmer') {
                try {
                    await sendVerificationEmail(email, verificationToken, firstName);
                    console.log('Verification email sent successfully');
                } catch (emailError) {
                    console.error('Error sending verification email:', emailError);
                    // Don't fail registration if email fails
                }
            }
        } catch (saveError) {
            console.error('Error saving user:', saveError);
            if (saveError.name === 'ValidationError') {
                const messages = Object.values(saveError.errors).map(val => val.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: messages
                });
            }
            if (saveError.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'An account with this email already exists'
                });
            }
            throw saveError;
        }

        // For both students and farmers, inform them to verify email before they can login
        if (userRole.toLowerCase() === 'student' || userRole.toLowerCase() === 'farmer') {
            return res.status(201).json({
                success: true,
                message: 'Registration successful! Please check your email to verify your account.',
                requiresVerification: true,
                email: email,
                userRole: userRole,
                verificationToken: verificationToken
            });
        }

        // For farmers, create token and allow immediate login
        const payload = {
            user: {
                id: user._id,
                email: user.email
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('JWT Error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error generating authentication token'
                    });
                }
                res.status(201).json({
                    success: true,
                    message: 'Registration successful!',
                    token,
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        middleName: user.middleName,
                        surname: user.surname,
                        birthdate: user.birthdate,
                        email: user.email,
                        userRole: user.userRole,
                    }
                });
            }
        );
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// @route   GET api/users/verify-email/:token
// @desc    Verify email address and auto-login for students and farmers
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with this verification token
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Update user as verified
        user.emailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        console.log('Email verified successfully for user:', user.email);

        // Generate JWT token for auto-login
        const authToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        // Prepare user data
        const fullName = `${user.firstName}${user.middleName ? ' ' + user.middleName : ''} ${user.surname}`;
        const userResponse = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            middleName: user.middleName,
            surname: user.surname,
            birthdate: user.birthdate,
            fullName: fullName,
            name: fullName,
            profilePicture: user.profilePicture,
            contactNumber: user.contactNumber,
            address: user.address,
            age: user.age,
            gender: user.gender,
            userRole: user.userRole,
            role: user.role
        };

        res.json({
            success: true,
            message: 'Email verified successfully! Logging you in...',
            token: authToken,
            user: userResponse,
            autoLogin: true
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email'
        });
    }
});

// @route   POST api/users/resend-verification
// @desc    Resend verification email to student or farmer
// @access  Public
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        // Check if already verified
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified. You can login now.'
            });
        }

        // Check if user is a student or farmer (both now require verification)
        if (user.userRole !== 'student' && user.userRole !== 'farmer') {
            return res.status(400).json({
                success: false,
                message: 'Email verification is only required for students and farmers'
            });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationExpires = generateTokenExpiry();

        // Update user with new token
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken, user.firstName);

        console.log('Verification email resent to:', user.email);

        res.json({
            success: true,
            message: 'Verification email sent! Please check your inbox.',
            email: user.email
        });
    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending verification email. Please try again later.'
        });
    }
});

// @route   POST api/users/lookup-email
// @desc    Find user's email by personal information
// @access  Public
router.post('/lookup-email', async (req, res) => {
    console.log('📧 Email lookup endpoint hit!', req.body);
    try {
        const { firstName, surname, birthdate } = req.body;

        // Validate required fields
        if (!firstName || !surname || !birthdate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your first name, surname, and birthdate'
            });
        }

        // Search for user by personal information
        const birthdateObj = new Date(birthdate);

        // Search with case-insensitive names
        const users = await User.find({
            firstName: { $regex: new RegExp(`^${firstName.trim()}$`, 'i') },
            surname: { $regex: new RegExp(`^${surname.trim()}$`, 'i') },
        });

        // Filter by birthdate (comparing dates properly)
        const matchedUser = users.find(user => {
            const userBirthdate = new Date(user.birthdate);
            return userBirthdate.toDateString() === birthdateObj.toDateString();
        });

        if (!matchedUser) {
            return res.status(404).json({
                success: false,
                message: 'No account found with the provided information. Please check your details and try again.'
            });
        }

        // Return the email and user type
        res.json({
            success: true,
            email: matchedUser.email,
            userRole: matchedUser.userRole,
            message: 'Email found successfully!'
        });
    } catch (error) {
        console.error('Email lookup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error looking up email. Please try again later.'
        });
    }
});

// @route   POST api/users/send-reset-otp
// @desc    Send OTP to user's phone for password reset
// @access  Public
router.post('/send-reset-otp', async (req, res) => {
    console.log('📧 [NEW CODE] Send reset OTP endpoint hit!', req.body);
    try {
        const { email, contactNumber, userRole } = req.body;

        console.log('🔍 Searching for user with email:', email?.toLowerCase().trim());

        // Validate required fields
        if (!email || !contactNumber || !userRole) {
            console.log('❌ Validation failed - missing fields');
            return res.status(400).json({
                success: false,
                message: 'Email, contact number, and user role are required'
            });
        }

        // Validate user role
        if (!['farmer', 'student'].includes(userRole.toLowerCase())) {
            console.log('❌ Invalid user role:', userRole);
            return res.status(400).json({
                success: false,
                message: 'Invalid user role'
            });
        }

        // Find user by email only (since we're using Gmail verification now)
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        console.log('🔍 User search result:', user ? `Found: ${user.email}` : 'NOT FOUND');

        if (!user) {
            console.log('❌ [NEW CODE] No user found with email:', email);
            return res.status(404).json({
                success: false,
                message: '🆕 NEW CODE: No account found with this email address. Please check your email and try again.'
            });
        }

        console.log('✅ [NEW CODE] User found:', user.email, 'Role:', user.role || user.userRole);

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to user
        user.passwordResetOTP = otp;
        user.passwordResetOTPExpires = otpExpires;
        await user.save();

        // Send OTP via email
        try {
            console.log('📧 Sending OTP email to:', user.email);
            await sendOTPEmail(user.email, otp, user.firstName);
            console.log('✅ OTP email sent successfully to:', user.email);
        } catch (emailError) {
            console.error('❌ Error sending OTP email:', emailError);
            // Don't fail the request if email fails, but log it
        }

        res.json({
            success: true,
            message: 'OTP has been sent to your email address. Please check your inbox.',
            email: user.email,
            otp: otp, // Include OTP for admin dashboard display and testing
            otpExpires: otpExpires.toISOString()
        });
    } catch (error) {
        console.error('❌ Error sending reset OTP:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error sending OTP. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST api/users/verify-otp-reset
// @desc    Verify OTP and reset password
// @access  Public
router.post('/verify-otp-reset', async (req, res) => {
    try {
        const { email, contactNumber, userRole, otp, newPassword } = req.body;

        // Validate required fields (email, otp, newPassword are essential)
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, and new password are required'
            });
        }

        // Validate password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Find user by email only (matching the send-reset-otp logic)
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address.'
            });
        }

        console.log('🔍 Verifying OTP for user:', user.email);

        // Verify OTP
        const isValidOTP = verifyOTP(user.passwordResetOTP, user.passwordResetOTPExpires, otp);

        if (!isValidOTP) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        user.passwordResetOTP = null;
        user.passwordResetOTPExpires = null;
        await user.save();

        console.log('Password reset successful for user:', user.email);

        res.json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Error verifying OTP and resetting password:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password. Please try again.'
        });
    }
});

// @route   GET api/users/reset-password/:token
// @desc    Verify password reset token
// @access  Public
router.get('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired password reset token'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            email: user.email
        });
    } catch (error) {
        console.error('Error verifying reset token:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying token'
        });
    }
});

// @route   POST api/users/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired password reset token'
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        console.log('Password reset successful for user:', user.email);

        res.json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password. Please try again.'
        });
    }
});

// @route   POST api/users/login
// @desc    Login user and get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Simple validation
        if (!email || !password) {
            console.log('Missing fields');
            return res.status(400).json({
                success: false,
                message: 'Please enter all required fields'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!user) {
            console.log('User not found');
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password');
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if email is verified for both students and farmers
        if (!user.emailVerified) {
            console.log('Email not verified for user');
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                requiresVerification: true
            });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        // Prepare user data to send back
        const fullName = `${user.firstName}${user.middleName ? ' ' + user.middleName : ''} ${user.surname}`;
        const userResponse = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            middleName: user.middleName,
            surname: user.surname,
            birthdate: user.birthdate,
            fullName: fullName,
            name: fullName, // Add name field for frontend compatibility
            profilePicture: user.profilePicture, // Include profile picture
            contactNumber: user.contactNumber,
            address: user.address,
            age: user.age,
            gender: user.gender,
            userRole: user.userRole,
            role: user.role
        };

        console.log('Login successful for user:', userResponse.email);

        res.json({
            success: true,
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// @route   POST api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Validate new password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userId = decoded.id || decoded.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token structure'
            });
        }

        // Get user with password
        const user = await User.findById(userId).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current
        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        console.log('Password changed successfully for user:', user.email);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password change'
        });
    }
});

// @route   POST api/users/send-password-change-otp
// @desc    Send OTP for password change confirmation
// @access  Private
router.post('/send-password-change-otp', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userId = decoded.id || decoded.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token structure'
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Store OTP in user document
        user.passwordChangeOTP = otp;
        user.passwordChangeOTPExpiry = otpExpiry;
        await user.save();

        // Send OTP via email
        await sendOTPEmail(user.email, otp, 'Password Change Confirmation');

        console.log('Password change OTP sent to user:', user.email);

        res.json({
            success: true,
            message: 'OTP sent to your email for password change confirmation'
        });

    } catch (error) {
        console.error('Send password change OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while sending OTP'
        });
    }
});

// @route   POST api/users/verify-otp-change-password
// @desc    Verify OTP and change password
// @access  Private
router.post('/verify-otp-change-password', async (req, res) => {
    try {
        const { otp, currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!otp || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'OTP, current password, and new password are required'
            });
        }

        // Validate new password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userId = decoded.id || decoded.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token structure'
            });
        }

        // Get user with password
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify OTP
        if (!user.passwordChangeOTP || !user.passwordChangeOTPExpiry) {
            return res.status(400).json({
                success: false,
                message: 'No OTP request found. Please request a new OTP.'
            });
        }

        if (user.passwordChangeOTPExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        if (user.passwordChangeOTP !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please check your email and try again.'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current
        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Update password
        user.password = newPassword;
        
        // Clear OTP fields
        user.passwordChangeOTP = undefined;
        user.passwordChangeOTPExpiry = undefined;
        
        await user.save();

        console.log('Password changed successfully with OTP verification for user:', user.email);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Verify OTP and change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password change'
        });
    }
});

// @route   POST api/users/resend-password-change-otp
// @desc    Resend OTP for password change confirmation
// @access  Private
router.post('/resend-password-change-otp', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userId = decoded.id || decoded.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token structure'
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Update OTP in user document
        user.passwordChangeOTP = otp;
        user.passwordChangeOTPExpiry = otpExpiry;
        await user.save();

        // Resend OTP via email
        await sendOTPEmail(user.email, otp, 'Password Change Confirmation');

        console.log('Password change OTP resent to user:', user.email);

        res.json({
            success: true,
            message: 'OTP resent to your email'
        });

    } catch (error) {
        console.error('Resend password change OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resending OTP'
        });
    }
});

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userId = decoded.id || decoded.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Invalid token structure' });
        }

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/users/activity
// @desc    Get user activity data
// @access  Private
router.get('/activity', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userId = decoded.id || decoded.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Invalid token structure' });
        }

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Mock activity data - in a real app, this would come from progress tracking
        const activityData = {
            coursesInProgress: 2,
            completedLessons: 12,
            achievementsUnlocked: 3,
            timeSpentThisWeek: 5.5, // hours
            timeSpentTotal: 24.8, // hours
            timeTrend: 12, // percentage increase from last week
            categoryBreakdown: [
                { category: 'Beginner', timeSpent: 15.2, coursesCompleted: 2 },
                { category: 'Intermediate', timeSpent: 8.1, coursesCompleted: 1 },
                { category: 'Advanced', timeSpent: 1.5, coursesCompleted: 0 }
            ]
        };

        res.json(activityData);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/users/all
// @desc    Get all registered users (admin dashboards)
// @access  Public (data is limited)
router.get('/all', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ success: false, message: 'Unable to load registered users.' });
    }
});

// @route   GET api/users/badge-views
// @desc    Get badge view state for current user
// @access  Private
router.get('/badge-views', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userId = decoded.id || decoded.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Invalid token structure' });
        }

        const user = await User.findById(userId).select('badgeViews');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            badgeViews: user.badgeViews || {
                lastAchievementCount: 0,
                lastQuizScoreCount: 0,
                lastCertificateCount: 0,
                lastNotificationCount: 0,
                lastStatisticsUpdate: null
            }
        });
    } catch (error) {
        console.error('Error fetching badge views:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/users/badge-views
// @desc    Update badge view state for current user
// @access  Private
router.put('/badge-views', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userId = decoded.id || decoded.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Invalid token structure' });
        }

        const { lastAchievementCount, lastQuizScoreCount, lastCertificateCount, lastNotificationCount } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    'badgeViews.lastAchievementCount': lastAchievementCount,
                    'badgeViews.lastQuizScoreCount': lastQuizScoreCount,
                    'badgeViews.lastCertificateCount': lastCertificateCount,
                    'badgeViews.lastNotificationCount': lastNotificationCount,
                    'badgeViews.lastStatisticsUpdate': new Date()
                }
            },
            { new: true, runValidators: true }
        ).select('badgeViews');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            badgeViews: user.badgeViews
        });
    } catch (error) {
        console.error('Error updating badge views:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/users/profile
// @desc    Update user profile (with optional profile picture)
// @access  Private
router.put('/profile', upload.single('profilePicture'), userAuth, async (req, res) => {
    try {
        // User is already authenticated and available as req.user from userAuth middleware
        const user = req.user;
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prepare update data
        const updateData = {};

        // Update allowed fields
        const allowedFields = ['firstName', 'middleName', 'surname', 'birthdate', 'contactNumber', 'address', 'gender'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                // Special handling for birthdate to ensure it's a valid date
                if (field === 'birthdate') {
                    const date = new Date(req.body[field]);
                    if (!isNaN(date.getTime())) {
                        updateData[field] = date;
                    }
                } else {
                    updateData[field] = req.body[field];
                }
            }
        });

        // Handle profile picture upload
        if (req.file) {
            // Store the new profile picture in database
            const newProfilePicture = new UserProfilePicture({
                userId: req.user._id,
                fileName: req.file.filename,
                filePath: `/uploads/profiles/${req.file.filename}`,
                originalName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                isActive: true
            });

            // Save the new profile picture record
            await newProfilePicture.save();

            // Deactivate old profile pictures using direct database operation
            await UserProfilePicture.updateMany(
                { userId: req.user._id, _id: { $ne: newProfilePicture._id }, isActive: true },
                { isActive: false }
            );

            // Delete old profile picture file if it exists
            if (user.profilePicture) {
                const oldPicturePath = path.join(__dirname, '../public', user.profilePicture);
                if (fs.existsSync(oldPicturePath)) {
                    fs.unlinkSync(oldPicturePath);
                }
            }

            // Update user's current profile picture
            updateData.profilePicture = `/uploads/profiles/${req.file.filename}`;
        }

        // Update user
        await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { runValidators: true }
        );

        // Fetch the complete updated user data
        const updatedUser = await User.findById(req.user._id).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Failed to update user'
            });
        }

        // Construct user response with complete user data
        const fullName = `${updatedUser.firstName}${updatedUser.middleName ? ' ' + updatedUser.middleName : ''} ${updatedUser.surname}`;
        const userResponse = {
            _id: updatedUser._id,
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            middleName: updatedUser.middleName,
            surname: updatedUser.surname,
            birthdate: updatedUser.birthdate,
            fullName: fullName,
            name: fullName, // Add name field for frontend compatibility
            contactNumber: updatedUser.contactNumber,
            address: updatedUser.address,
            age: updatedUser.age,
            gender: updatedUser.gender,
            profilePicture: updatedUser.profilePicture,
            userRole: updatedUser.userRole,
            role: updatedUser.role
        };

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: userResponse
        });

    } catch (error) {
        console.error('Error updating profile:', error);

        // Delete uploaded file if there was an error
        if (req.file) {
            const filePath = path.join(__dirname, '../public/uploads/profiles', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating profile'
        });
    }
});

// @route   GET api/users/profile-pictures
// @desc    Get user's profile picture history
// @access  Private
router.get('/profile-pictures', userAuth, async (req, res) => {
    try {
        const pictureHistory = await UserProfilePicture.getUserPictureHistory(req.user._id);
        
        res.json({
            success: true,
            pictures: pictureHistory.map(pic => ({
                id: pic._id,
                fileName: pic.fileName,
                filePath: pic.filePath,
                originalName: pic.originalName,
                fileSize: pic.getFormattedFileSize(),
                mimeType: pic.mimeType,
                isActive: pic.isActive,
                uploadedAt: pic.uploadedAt
            }))
        });
    } catch (error) {
        console.error('Error fetching profile picture history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile picture history'
        });
    }
});

// @route   PUT api/users/profile-pictures/:pictureId/restore
// @desc    Restore a previous profile picture
// @access  Private
router.put('/profile-pictures/:pictureId/restore', userAuth, async (req, res) => {
    try {
        const { pictureId } = req.params;
        
        // Find the picture to restore
        const pictureToRestore = await UserProfilePicture.findOne({ 
            _id: pictureId, 
            userId: req.user._id 
        });
        
        if (!pictureToRestore) {
            return res.status(404).json({
                success: false,
                message: 'Profile picture not found'
            });
        }
        
        // Deactivate all current pictures
        await UserProfilePicture.updateMany(
            { userId: req.user._id, isActive: true },
            { isActive: false }
        );
        
        // Activate the selected picture
        pictureToRestore.isActive = true;
        await pictureToRestore.save();
        
        // Update user's current profile picture
        await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture: pictureToRestore.filePath }
        );
        
        // Fetch updated user data
        const updatedUser = await User.findById(req.user._id).select('-password');
        
        // Construct user response
        const fullName = `${updatedUser.firstName}${updatedUser.middleName ? ' ' + updatedUser.middleName : ''} ${updatedUser.surname}`;
        const userResponse = {
            _id: updatedUser._id,
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            middleName: updatedUser.middleName,
            surname: updatedUser.surname,
            birthdate: updatedUser.birthdate,
            fullName: fullName,
            name: fullName,
            contactNumber: updatedUser.contactNumber,
            address: updatedUser.address,
            age: updatedUser.age,
            gender: updatedUser.gender,
            profilePicture: updatedUser.profilePicture,
            userRole: updatedUser.userRole,
            role: updatedUser.role
        };
        
        res.json({
            success: true,
            message: 'Profile picture restored successfully',
            user: userResponse
        });
        
    } catch (error) {
        console.error('Error restoring profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Error restoring profile picture'
        });
    }
});

module.exports = router;