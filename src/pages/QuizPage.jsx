import React from 'react';
import QuizAccessControl from '../components/QuizAccessControl';

// Quiz component mapping
const quizComponents = {
  'cacao-history': () => import('../GameQuizes/CacaoHistoryGame'),
  'care-management': () => import('../GameQuizes/CareManagementGame'),
  'planting-techniques': () => import('../GameQuizes/CacaoProcessingGame'),
  'cacao-processing': () => import('../GameQuizes/CacaoProcessingGame'),
  'pest-disease': () => import('../GameQuizes/PestDiseaseGame'),
  'cloning-types': () => import('../GameQuizes/CloningTypesGames'),
  'gap-scramble': () => import('../GameQuizes/GAPScrambleGame'),
  'interactive-quiz': () => import('../GameQuizes/InteractiveQuiz'),
  'matching-cards': () => import('../GameQuizes/MatchingCardsGame'),
  'memory-game': () => import('../GameQuizes/MemoryGame')
};

const quizNames = {
  'cacao-history': 'Cacao History Quiz',
  'care-management': 'Care Management Quiz',
  'planting-techniques': 'Planting Techniques Quiz',
  'cacao-processing': 'Cacao Processing Quiz',
  'pest-disease': 'Pest & Disease Quiz',
  'cloning-types': 'Cloning Types Quiz',
  'gap-scramble': 'GAP Practices Quiz',
  'interactive-quiz': 'Interactive Quiz',
  'matching-cards': 'Matching Cards Quiz',
  'memory-game': 'Memory Game Quiz'
};

const courseQuizMapping = {
  'cacao-basics': 'cacao-history',
  'care-management': 'care-management',
  'planting-techniques': 'planting-techniques',
  'harvest-processing': 'cacao-processing',
  'pest-disease': 'pest-disease',
  'cloning-techniques': 'cloning-types',
  'gap-practices': 'gap-scramble'
};

const QuizPage = () => {
  // This component will be replaced by the QuizAccessControl
  // The actual quiz logic is handled by the access control component
  return <div>Loading quiz...</div>;
};

// Export the access control wrapper
export default QuizPage;

// Export the quiz access control for use in routing
export { QuizAccessControl, quizComponents, quizNames, courseQuizMapping };
