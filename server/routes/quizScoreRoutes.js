const express = require('express');
const router = express.Router();
const QuizScore = require('../models/QuizScore');
const userAuth = require('../middleware/userAuth');

// Helper function to map quiz files to quiz IDs
const getQuizIdFromFileName = (fileName) => {
  const quizMap = {
    'CacaoProcessingGame': 'cacao-processing',
    'CareManagementGame': 'care-management',
    'CloningTypesGames': 'cloning-types',
    'GAPScrambleGame': 'gap-scramble',
    'InteractiveQuiz': 'interactive-quiz',
    'MatchingCardsGame': 'matching-cards',
    'MemoryGame': 'memory-game',
    'PestDiseaseGame': 'pest-disease'
  };
  return quizMap[fileName] || fileName.toLowerCase().replace(/game/g, '').replace(/jsx/g, '').trim();
};

// Get quiz name from quiz ID
const getQuizName = (quizId) => {
  const quizNames = {
    'cacao-processing-quiz': 'Cacao Processing Quiz',
    'cacao-processing': 'Cacao Processing Quiz',
    'care-management-quiz': 'Care Management Quiz',
    'care-management': 'Care Management Quiz',
    'cloning-types-quiz': 'Cloning Types Quiz',
    'cloning-types': 'Cloning Types Quiz',
    'gap-practices-quiz': 'GAP Practices Quiz',
    'gap-scramble-quiz': 'GAP Scramble Quiz',
    'gap-scramble': 'GAP Scramble Quiz',
    'interactive-quiz': 'Interactive Quiz',
    'matching-cards-quiz': 'Matching Cards Quiz',
    'matching-cards': 'Matching Cards Quiz',
    'memory-game-quiz': 'Memory Game Quiz',
    'memory-game': 'Memory Game Quiz',
    'pest-disease-quiz': 'Pest Disease Quiz',
    'pest-disease': 'Pest Disease Quiz',
    'cacao-history-quiz': 'Cacao History Quiz'
  };
  return quizNames[quizId] || 'Quiz Game';
};

// TEST endpoint (no auth)
router.post('/test', async (req, res) => {
  console.log('🧪 TEST endpoint hit!', req.body);
  res.json({ message: 'Test endpoint working!', body: req.body });
});

// POST - Save or update quiz score
router.post('/score', userAuth, async (req, res) => {
  try {
    console.log('📥 Received quiz score request:', req.body);
    const { quizId, score, totalQuestions, correctAnswers, timeTaken } = req.body;
    const userId = req.user.id;

    console.log('🔍 Validating fields:', { quizId, score, totalQuestions, correctAnswers, timeTaken, userId });

    if (!quizId || score === undefined || !totalQuestions || correctAnswers === undefined || timeTaken === undefined) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        message: 'Missing required fields: quizId, score, totalQuestions, correctAnswers, timeTaken'
      });
    }

    // Validate score range
    if (score < 0 || score > 100) {
      console.log('❌ Score out of range:', score);
      return res.status(400).json({ message: 'Score must be between 0 and 100' });
    }

    console.log('🔍 Looking for existing score...');
    // Find existing score or create new one
    let quizScore = await QuizScore.findOne({ userId, quizId });
    
    if (quizScore) {
      // Update existing score
      await quizScore.updateScore(score, totalQuestions, correctAnswers, timeTaken);
    } else {
      // Create new score record
      quizScore = new QuizScore({
        userId,
        quizId,
        quizName: getQuizName(quizId),
        score,
        totalQuestions,
        correctAnswers,
        timeTaken,
        bestScore: score,
        averageScore: score,
        attempts: 1
      });
      
      await quizScore.save();
    }

    console.log(`🎮 Quiz score saved: User ${userId}, Quiz ${quizId}, Score ${score}%`);

    // Quiz completion notifications removed - only course completion notifications will be shown
    // Quiz scores are still saved and available in Quiz Scores tab, but won't create notifications

    res.json({
      message: 'Quiz score saved successfully',
      quizScore: {
        quizId: quizScore.quizId,
        quizName: quizScore.quizName,
        score: quizScore.score,
        bestScore: quizScore.bestScore,
        attempts: quizScore.attempts,
        averageScore: quizScore.averageScore,
        completedAt: quizScore.completedAt
      }
    });

  } catch (error) {
    console.error('❌ Error saving quiz score:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error saving quiz score', error: error.message });
  }
});

// GET - Get user's quiz scores
router.get('/my-scores', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const scores = await QuizScore.find({ userId }).sort({ completedAt: -1 });

    res.json({
      message: 'Quiz scores retrieved successfully',
      scores: scores.map(score => ({
        quizId: score.quizId,
        quizName: score.quizName,
        score: score.score,
        totalQuestions: score.totalQuestions,
        correctAnswers: score.correctAnswers,
        timeTaken: score.timeTaken,
        bestScore: score.bestScore,
        attempts: score.attempts,
        averageScore: score.averageScore,
        completedAt: score.completedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching quiz scores:', error);
    res.status(500).json({ message: 'Error fetching quiz scores', error: error.message });
  }
});

// GET - Get user's quiz statistics
router.get('/stats', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await QuizScore.getUserQuizStats(userId);

    res.json({
      message: 'Quiz statistics retrieved successfully',
      stats
    });

  } catch (error) {
    console.error('Error fetching quiz statistics:', error);
    res.status(500).json({ message: 'Error fetching quiz statistics', error: error.message });
  }
});

// GET - Get leaderboard for a specific quiz
router.get('/leaderboard/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { limit = 10 } = req.query;

    const leaderboard = await QuizScore.find({ quizId })
      .populate('userId', 'fullName email')
      .sort({ bestScore: -1, completedAt: -1 })
      .limit(parseInt(limit));

    res.json({
      message: 'Leaderboard retrieved successfully',
      quizId,
      quizName: getQuizName(quizId),
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId._id,
        userName: entry.userId.fullName,
        userEmail: entry.userId.email,
        bestScore: entry.bestScore,
        attempts: entry.attempts,
        averageScore: entry.averageScore,
        lastPlayed: entry.completedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
});

// GET - Get all quiz scores for admin
router.get('/all-scores', userAuth, async (req, res) => {
  try {
    // Check if user is admin (you might want to add role checking)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const scores = await QuizScore.find({})
      .populate('userId', 'fullName email')
      .sort({ completedAt: -1 });

    res.json({
      message: 'All quiz scores retrieved successfully',
      totalScores: scores.length,
      scores: scores.map(score => ({
        userId: score.userId._id,
        userName: score.userId.fullName,
        userEmail: score.userId.email,
        quizId: score.quizId,
        quizName: score.quizName,
        score: score.score,
        bestScore: score.bestScore,
        attempts: score.attempts,
        averageScore: score.averageScore,
        completedAt: score.completedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching all quiz scores:', error);
    res.status(500).json({ message: 'Error fetching all quiz scores', error: error.message });
  }
});

module.exports = router;
