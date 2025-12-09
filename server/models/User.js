const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please provide your first name'],
        trim: true
    },
    middleName: {
        type: String,
        trim: true,
        default: ''
    },
    surname: {
        type: String,
        required: [true, 'Please provide your surname'],
        trim: true
    },
    birthdate: {
        type: Date,
        required: [true, 'Please provide your birthdate']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpires: {
        type: Date,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    passwordResetOTP: {
        type: String,
        default: null
    },
    passwordResetOTPExpires: {
        type: Date,
        default: null
    },
    passwordChangeOTP: {
        type: String,
        default: null
    },
    passwordChangeOTPExpiry: {
        type: Date,
        default: null
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    contactNumber: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say'],
        lowercase: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    userRole: {
        type: String,
        enum: ['farmer', 'student'],
        required: [true, 'Please select a role'],
        lowercase: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    badgeViews: {
        lastAchievementCount: { type: Number, default: 0 },
        lastQuizScoreCount: { type: Number, default: 0 },
        lastCertificateCount: { type: Number, default: 0 },
        lastNotificationCount: { type: Number, default: 0 },
        lastStatisticsUpdate: { type: Date, default: null }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Virtual field for fullName
UserSchema.virtual('fullName').get(function() {
    if (this.middleName) {
        return `${this.firstName} ${this.middleName} ${this.surname}`;
    }
    return `${this.firstName} ${this.surname}`;
});

// Ensure virtuals are included in JSON output
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);