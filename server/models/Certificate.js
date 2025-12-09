const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: String,
    required: true
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  },
  finalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalTimeSpent: {
    type: Number,
    required: true // in minutes
  },
  courseTitle: {
    type: String,
    required: true
  },
  courseCategory: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  instructorName: {
    type: String,
    default: 'AgriLearn Cacao Instructor'
  },
  verificationUrl: {
    type: String
  },
  certificateImage: {
    type: String // Path to generated certificate image
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  metadata: {
    totalLessons: {
      type: Number,
      default: 0
    },
    totalQuizzes: {
      type: Number,
      default: 0
    },
    averageQuizScore: {
      type: Number,
      default: 0
    },
    completionTime: {
      type: String // e.g., "2 weeks, 3 days"
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
certificateSchema.index({ userId: 1, courseId: 1 });
// certificateId already has unique: true in schema, no need for duplicate index
certificateSchema.index({ issuedDate: -1 });

// Pre-save middleware to generate certificate ID and verification URL
certificateSchema.pre('save', function(next) {
  if (!this.certificateId) {
    // Generate unique certificate ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.certificateId = `CERT-${timestamp}-${random}`.toUpperCase();
  }
  
  if (!this.verificationUrl) {
    this.verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${this.certificateId}`;
  }
  
  next();
});

// Static method to generate certificate image
certificateSchema.statics.generateCertificateImage = async function(certificateData) {
  // This would integrate with a certificate generation library
  // For now, return a placeholder
  const imagePath = `/certificates/${certificateData.certificateId}.png`;
  return imagePath;
};

module.exports = mongoose.model('Certificate', certificateSchema);
