const mongoose = require('mongoose');

const UserProfilePictureSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
UserProfilePictureSchema.index({ userId: 1, isActive: 1 });
UserProfilePictureSchema.index({ uploadedAt: -1 });

// Static method to get user's active profile picture
UserProfilePictureSchema.getActiveProfilePicture = function(userId) {
    return this.findOne({ userId, isActive: true }).sort({ uploadedAt: -1 });
};

// Static method to deactivate old profile pictures
UserProfilePictureSchema.deactivateOldPictures = function(userId, excludeId) {
    return this.updateMany(
        { userId, _id: { $ne: excludeId }, isActive: true },
        { isActive: false }
    );
};

// Static method to get user's profile picture history
UserProfilePictureSchema.getUserPictureHistory = function(userId, limit = 10) {
    return this.find({ userId })
        .sort({ uploadedAt: -1 })
        .limit(limit);
};

// Method to get file URL
UserProfilePictureSchema.methods.getFileUrl = function() {
    return `${this.filePath}`;
};

// Method to get formatted file size
UserProfilePictureSchema.methods.getFormattedFileSize = function() {
    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = mongoose.model('UserProfilePicture', UserProfilePictureSchema);
