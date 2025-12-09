const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: String,
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedLessons: [{
    lessonId: {
      type: String,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    }
  }],
  quizResults: [{
    lessonId: {
      type: String,
      required: true
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    correctAnswers: {
      type: Number,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    attempts: {
      type: Number,
      default: 1
    }
  }],
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  certificateEarned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
courseProgressSchema.index({ userId: 1, isCompleted: 1 });

// Method to calculate overall progress
courseProgressSchema.methods.calculateProgress = function() {
  // Updated lesson counts based on actual course structure
  const courseLessonCounts = {
    'cacao-basics': 4,           // intro-cacao, cacao-history, cacao-varieties, growing-conditions
    'planting-techniques': 4,    // soil-requirements, shade-management, nursery-care, planting-methods
    'harvest-processing': 11,     // 11 lessons from harvest-timing to common-defects
    'pest-disease': 15,          // 15 lessons from pest-identification to safety-measures
    'cloning-techniques': 6,     // why-clone-cacao, cloning-basics, cloning-methods-overview, grafting-techniques, nursery-establishment, acclimatization
    'care-management': 9,         // irrigation-methods, water-conservation, drainage-systems, pruning-techniques, canopy-management, pruning-schedule, essential-nutrients, fertilization, soil-health
    'gap-practices': 3,           // gap-principles, benefits-gap, regulatory-framework
    'cacao-history': 4            // ancient-origins, cultural-significance, global-spread, modern-industry
  };
  
  const totalLessons = courseLessonCounts[this.courseId] || 4;
  const completedLessons = this.completedLessons.length;
  const totalQuizzes = this.quizResults.length;
  const quizScoreAverage = this.quizResults.reduce((sum, quiz) => sum + quiz.score, 0) / (totalQuizzes || 1);
  
  // Simple and correct progress calculation based on lessons completed
  let calculatedProgress;
  if (this.courseId === 'gap-practices') {
    // GAP has 3 lessons total
    calculatedProgress = completedLessons >= 3 ? 100 : Math.round((completedLessons / 3) * 100);
  } else {
    // For all other courses: 70% lessons + 30% quiz performance
    const lessonProgress = (completedLessons / totalLessons) * 70;
    const quizProgress = (quizScoreAverage / 100) * 30;
    calculatedProgress = Math.min(100, Math.round(lessonProgress + quizProgress));
  }
  
  this.overallProgress = calculatedProgress;
  this.averageScore = Math.round(quizScoreAverage);
  
  // Mark as completed if progress is 100% or higher
  if (this.overallProgress >= 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  
  return this.overallProgress;
};

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
