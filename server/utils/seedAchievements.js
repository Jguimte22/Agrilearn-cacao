const { Achievement } = require('../models/Achievement');
const mongoose = require('mongoose');

const achievements = [
  {
    name: 'First Steps',
    description: 'Complete your first cacao course',
    icon: 'FiBook',
    category: 'course_completion',
    type: 'automatic',
    conditions: {
      target: 1
    },
    points: 10,
    badgeColor: '#8B5A2B',
    rarity: 'common',
    sortOrder: 1
  },
  {
    name: 'Cacao Beginner',
    description: 'Complete 3 cacao courses',
    icon: 'FiAward',
    category: 'course_completion',
    type: 'automatic',
    conditions: {
      target: 3
    },
    points: 25,
    badgeColor: '#D4A76A',
    rarity: 'common',
    sortOrder: 2
  },
  {
    name: 'Dedicated Farmer',
    description: 'Complete 5 cacao courses',
    icon: 'FiHeart',
    category: 'course_completion',
    type: 'automatic',
    conditions: {
      target: 5
    },
    points: 50,
    badgeColor: '#8BC34A',
    rarity: 'uncommon',
    sortOrder: 3
  },
  {
    name: 'High Achiever',
    description: 'Score over 500 total points',
    icon: 'FiAward',
    category: 'quiz_score',
    type: 'automatic',
    conditions: {
      target: 500
    },
    points: 75,
    badgeColor: '#FFA500',
    rarity: 'uncommon',
    sortOrder: 4
  },
  {
    name: 'Expert Farmer',
    description: 'Complete 8 cacao courses',
    icon: 'FiTarget',
    category: 'course_completion',
    type: 'automatic',
    conditions: {
      target: 8
    },
    points: 100,
    badgeColor: '#FF6B6B',
    rarity: 'rare',
    sortOrder: 5
  },
  {
    name: 'Quiz Master',
    description: 'Score over 1000 total points',
    icon: 'FiStar',
    category: 'quiz_score',
    type: 'automatic',
    conditions: {
      target: 1000
    },
    points: 150,
    badgeColor: '#9C27B0',
    rarity: 'rare',
    sortOrder: 6
  },
  {
    name: 'Consistent Learner',
    description: 'Have 3 courses in progress',
    icon: 'FiTrendingUp',
    category: 'streak',
    type: 'automatic',
    conditions: {
      target: 3
    },
    points: 30,
    badgeColor: '#2196F3',
    rarity: 'common',
    sortOrder: 7
  },
  {
    name: 'Cacao Master',
    description: 'Complete all available courses',
    icon: 'FiZap',
    category: 'course_completion',
    type: 'automatic',
    conditions: {
      target: 'all'
    },
    points: 200,
    badgeColor: '#FFD700',
    rarity: 'epic',
    sortOrder: 8
  },
  {
    name: 'Early Bird',
    description: 'Complete a course within the first week',
    icon: 'FiSun',
    category: 'time_spent',
    type: 'automatic',
    conditions: {
      targetMinutes: 7 * 24 * 60 // 7 days in minutes
    },
    points: 40,
    badgeColor: '#FFC107',
    rarity: 'uncommon',
    sortOrder: 9
  },
  {
    name: 'Night Owl',
    description: 'Study during evening hours',
    icon: 'FiMoon',
    category: 'time_spent',
    type: 'automatic',
    conditions: {
      targetMinutes: 180 // 3 hours in evening
    },
    points: 35,
    badgeColor: '#3F51B5',
    rarity: 'uncommon',
    sortOrder: 10
  },
  {
    name: 'Perfectionist',
    description: 'Achieve 90% or higher average score',
    icon: 'FiCheckCircle',
    category: 'quiz_score',
    type: 'automatic',
    conditions: {
      minScore: 90
    },
    points: 60,
    badgeColor: '#4CAF50',
    rarity: 'rare',
    sortOrder: 11
  },
  {
    name: 'Enthusiast',
    description: 'Complete 10 lessons total',
    icon: 'FiGift',
    category: 'course_completion',
    type: 'automatic',
    conditions: {
      target: 10
    },
    points: 45,
    badgeColor: '#E91E63',
    rarity: 'uncommon',
    sortOrder: 12
  },
  {
    name: 'Persistent Farmer',
    description: 'Continue learning for 7 days straight',
    icon: 'FiCalendar',
    category: 'streak',
    type: 'automatic',
    conditions: {
      target: 7
    },
    points: 55,
    badgeColor: '#795548',
    rarity: 'rare',
    sortOrder: 13
  },
  {
    name: 'Quick Learner',
    description: 'Complete 2 courses in one day',
    icon: 'FiClock',
    category: 'course_completion',
    type: 'automatic',
    conditions: {
      target: 2,
      timeframe: '1 day'
    },
    points: 65,
    badgeColor: '#FF5722',
    rarity: 'rare',
    sortOrder: 14
  },
  {
    name: 'Knowledge Seeker',
    description: 'Score over 1500 total points',
    icon: 'FiBarChart2',
    category: 'quiz_score',
    type: 'automatic',
    conditions: {
      target: 1500
    },
    points: 125,
    badgeColor: '#673AB7',
    rarity: 'epic',
    sortOrder: 15
  },
  {
    name: 'Cacao Champion',
    description: 'Complete 10 courses with 80% average',
    icon: 'FiAward',
    category: 'course_completion',
    type: 'automatic',
    conditions: {
      target: 10,
      minScore: 80
    },
    points: 250,
    badgeColor: '#FF9800',
    rarity: 'legendary',
    sortOrder: 16
  }
];

const seedAchievements = async () => {
  try {
    console.log('🏆 Seeding achievements...'.yellow);
    
    // Delete existing achievements
    await Achievement.deleteMany({});
    console.log('🗑️  Deleted existing achievements'.red);
    
    // Insert new achievements
    const insertedAchievements = await Achievement.insertMany(achievements);
    console.log(`✅ Successfully seeded ${insertedAchievements.length} achievements`.green);
    
    return insertedAchievements;
  } catch (error) {
    console.error('❌ Error seeding achievements:', error);
    throw error;
  }
};

module.exports = seedAchievements;
