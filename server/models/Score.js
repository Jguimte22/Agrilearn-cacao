const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  totalItems: {
    type: Number,
    required: true,
    min: 1
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    // Time spent in seconds
    type: Number,
    required: true
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    selectedOption: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    points: Number
  }]
}, { timestamps: true });

// Index for faster querying of user scores
ScoreSchema.index({ userId: 1, courseId: 1 });
ScoreSchema.index({ userId: 1, moduleId: 1 });

module.exports = mongoose.model('Score', ScoreSchema);
