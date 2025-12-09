// In server/models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const AdminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        // unique index with case-insensitive collation defined below
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ],
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password; // Never send password in responses
            return ret;
        }
    },
    toObject: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password; // Never send password in responses
            return ret;
        }
    }
});

// Encrypt password using bcrypt
AdminSchema.pre('save', async function(next) {
    // Only run this if password was modified
    if (!this.isModified('password')) {
        console.log('Password not modified, skipping hash');
        return next();
    }

    try {
        console.log('🔒 Hashing password...');
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('✅ Password hashed successfully');
        next();
    } catch (error) {
        console.error('❌ Error hashing password:', error);
        next(error);
    }
});

// Sign JWT and return
AdminSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { 
            id: this._id, 
            role: this.role,
            email: this.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Match admin entered password to hashed password in database
AdminSchema.methods.matchPassword = async function(enteredPassword) {
    try {
        console.log('🔑 Comparing passwords...');
        console.log('Entered password length:', enteredPassword ? enteredPassword.length : 0);
        console.log('Stored password hash:', this.password ? 'exists' : 'missing');
        
        if (!enteredPassword || !this.password) {
            console.log('❌ Missing password for comparison');
            return false;
        }

        const isMatch = await bcrypt.compare(enteredPassword, this.password);
        console.log('✅ Password match result:', isMatch);
        return isMatch;
    } catch (error) {
        console.error('❌ Error in matchPassword:', error);
        return false;
    }
};

// Generate and hash password token
AdminSchema.methods.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Prevent duplicate emails
AdminSchema.index({ email: 1 }, { 
    unique: true,
    collation: { locale: 'en', strength: 2 } // Case-insensitive index
});

// Add text index for search functionality
AdminSchema.index(
    { name: 'text', email: 'text' },
    { 
        weights: { name: 5, email: 1 },
        collation: { locale: 'en', strength: 2 } // Case-insensitive
    }
);

module.exports = mongoose.model('Admin', AdminSchema);