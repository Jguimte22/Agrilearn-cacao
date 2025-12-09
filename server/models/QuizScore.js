const mongoose = require('mongoose');

const quizScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: String,
    required: true,
    enum: [
      'cacao-processing-quiz',
      'cacao-processing',
      'care-management-quiz',
      'care-management',
      'cloning-types-quiz',
      'cloning-types',
      'gap-practices-quiz',
      'gap-scramble-quiz',
      'gap-scramble',
      'interactive-quiz',
      'matching-cards-quiz',
      'matching-cards',
      'memory-game-quiz',
      'memory-game',
      'pest-disease-quiz',
      'pest-disease',
      'cacao-history-quiz'
    ]
  },
  quizName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  timeTaken: {
    type: Number, // in seconds
    required: true,
    min: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  attempts: {
    type: Number,
    default: 1
  },
  bestScore: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
quizScoreSchema.index({ userId: 1, quizId: 1 }, { unique: true });
quizScoreSchema.index({ userId: 1 });
quizScoreSchema.index({ quizId: 1 });

// Method to update score statistics
quizScoreSchema.methods.updateScore = function(newScore, totalQuestions, correctAnswers, timeTaken) {
  this.score = newScore;
  this.totalQuestions = totalQuestions;
  this.correctAnswers = correctAnswers;
  this.timeTaken = timeTaken;
  this.completedAt = new Date();
  this.attempts += 1;
  
  // Update best score
  if (newScore > this.bestScore) {
    this.bestScore = newScore;
  }
  
  // Calculate average score (simplified - could be more sophisticated)
  this.averageScore = Math.round((this.averageScore * (this.attempts - 1) + newScore) / this.attempts);
  
  return this.save();
};

// Static method to get user's quiz statistics
quizScoreSchema.statics.getUserQuizStats = async function(userId) {
  const scores = await this.find({ userId });
  
  const stats = {
    totalQuizzes: scores.length,
    averageScore: 0,
    bestScore: 0,
    totalAttempts: 0,
    completedQuizzes: scores.filter(s => s.score > 0).length,
    quizBreakdown: {}
  };
  
  if (scores.length > 0) {
    stats.averageScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
    stats.bestScore = Math.max(...scores.map(s => s.score));
    stats.totalAttempts = scores.reduce((sum, s) => sum + s.attempts, 0);
    
    scores.forEach(score => {
      stats.quizBreakdown[score.quizId] = {
        quizName: score.quizName,
        bestScore: score.bestScore,
        attempts: score.attempts,
        averageScore: score.averageScore,
        lastPlayed: score.completedAt
      };
    });
  }
  
  return stats;
};

module.exports = mongoose.model('QuizScore', quizScoreSchema);
