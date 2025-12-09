// Quiz Score API Service
const API_BASE_URL = 'http://localhost:5000/api/quiz-scores';

// Helper function to get auth token
const getAuthToken = () => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

const quizScoreAPI = {
  // Save quiz score
  saveScore: async (quizId, score, totalQuestions, correctAnswers, timeTaken) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId,
          score,
          totalQuestions,
          correctAnswers,
          timeTaken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save quiz score');
      }

      const data = await response.json();
      console.log('🎮 Quiz score saved:', data.quizScore);
      
      // Reset badge viewed state when new score is saved
      localStorage.removeItem('quizScoresBadgeViewed');
      localStorage.setItem('showQuizScoresBadge', 'true');
      
      return data.quizScore;
    } catch (error) {
      console.error('Error saving quiz score:', error);
      throw error;
    }
  },

  // Get user's quiz scores
  getMyScores: async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/my-scores`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch quiz scores');
      }

      const data = await response.json();
      return data.scores;
    } catch (error) {
      console.error('Error fetching quiz scores:', error);
      throw error;
    }
  },

  // Get user's quiz statistics
  getStats: async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch quiz statistics');
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Error fetching quiz statistics:', error);
      throw error;
    }
  },

  // Get leaderboard for a specific quiz
  getLeaderboard: async (quizId, limit = 10) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/leaderboard/${quizId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch leaderboard');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },

  // Helper function to get quiz ID from component name
  getQuizIdFromComponent: (componentName) => {
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
    return quizMap[componentName] || componentName.toLowerCase().replace(/game/g, '').trim();
  }
};

export default quizScoreAPI;
