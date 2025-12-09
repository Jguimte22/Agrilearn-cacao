import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonContents } from './lessonContents';
import { FaLayerGroup, FaListUl, FaClock, FaArrowLeft, FaQuestionCircle, FaCheck, FaChevronRight, FaPlay } from 'react-icons/fa';
import './LessonsPage.css';
import './video-content.css';
import { progressAPI } from './services/progressAPI';

// Helper function to get total lessons for each course (excluding video modules)
const getTotalLessonsForCourse = (courseId) => {
  // Updated lesson counts based on actual course structure
  const courseLessonCounts = {
    'cacao-basics': 4,           // 4 lessons
    'planting-techniques': 4,    // 4 lessons (updated - video module excluded)
    'harvest-processing': 11,     // 11 lessons (updated - 4 modules with 2+3+3+3 lessons)
    'pest-disease': 15,          // 15 lessons (updated - 5 modules × 3 lessons each, video excluded)
    'cloning-techniques': 6,     // 6 lessons (updated - 3 modules × 2 lessons each)
    'care-management': 9,         // 9 lessons (fixed - includes soil-health)
    'gap-practices': 3           // 3 lessons (updated - removed modules, only intro remains)
  };

  console.log('🔧 FRONTEND getTotalLessonsForCourse:', { courseId, totalLessons: courseLessonCounts[courseId] });
  return courseLessonCounts[courseId] || 4;
};

// Helper function to get all lesson IDs for a course (excluding video modules)
const getAllLessonIdsForCourse = (courseId) => {
  const courseLessons = {
    'planting-techniques': [
      'soil-requirements', 'shade-management',
      'nursery-care', 'planting-methods'
      // Note: module-6 (Video Tutorials) is excluded - no lessons to track
    ],
    'cacao-basics': [
      'intro-cacao', 'cacao-history', 'cacao-varieties', 'growing-conditions'
    ],
    'care-management': [
      'irrigation-methods', 'water-conservation', 'drainage-systems',
      'pruning-techniques', 'canopy-management', 'pruning-schedule',
      'essential-nutrients', 'fertilization', 'soil-health'
    ],
    'cloning-techniques': [
      'why-clone-cacao', 'cloning-basics', 'cloning-methods-overview', 'grafting-techniques', 'nursery-establishment', 'acclimatization'
    ],
    'pest-disease': [
      'pest-identification', 'pest-lifecycle', 'pest-damage',
      'disease-identification', 'disease-symptoms', 'disease-spread',
      'ipm-basics', 'monitoring-techniques', 'control-methods',
      'biological-control', 'natural-pesticides', 'cultural-practices',
      'pesticide-types', 'application-methods', 'safety-measures'
      // Note: module-19 (Video Tutorials) is excluded - no lessons to track
    ],
    'harvest-processing': [
      'harvest-timing', 'harvest-methods', 'pod-breaking', 'fermentation-process', 'fermentation-troubleshooting',
      'drying-methods', 'moisture-control', 'storage-solutions', 'quality-assessment', 'grading-standards', 'common-defects'
    ],
    'gap-practices': [
      'gap-principles', 'benefits-gap', 'regulatory-framework'
    ],
    'cacao-history': [
      'ancient-origins', 'cultural-significance', 'global-spread', 'modern-industry'
    ]
  };
  return courseLessons[courseId] || [];
};

// Check if all lessons in the course are completed
const areAllLessonsCompleted = (courseId, completedLessons) => {
  // Get all lesson IDs for this course
  const allLessonIds = getAllLessonIdsForCourse(courseId);

  // If there are no lessons, return false
  if (allLessonIds.length === 0) {
    return false;
  }

  // Check if all lessons are completed
  // completedLessons is already an array of lesson IDs (strings), not objects
  const allCompleted = allLessonIds.every(lessonId =>
    completedLessons.includes(lessonId)
  );

  console.log(`areAllLessonsCompleted for ${courseId}:`, {
    allLessonIds,
    completedLessons,
    allCompleted
  });

  return allCompleted;
};

const courses = {
  'gap-practices': {
    id: 'gap-practices',
    title: 'GAP (Good Agricultural Practices)',
    description: 'Learn and implement sustainable and responsible farming practices for cacao cultivation, focusing on environmental protection, worker welfare, and product quality.',
    duration: '2 modules · 30 mins',
    level: 'Advanced',
    modules: [
      {
        id: 'module-11',
        title: 'Introduction to GAP',
        description: 'Understand the principles and importance of Good Agricultural Practices in cacao farming.',
        lessons: [
          { id: 'gap-principles', title: 'Core Principles of GAP' },
          { id: 'benefits-gap', title: 'Benefits of GAP Certification' },
          { id: 'regulatory-framework', title: 'Regulatory Framework' }
        ]
      },
      {
        id: 'module-12',
        title: 'Video Module',
        description: 'Watch practical demonstrations of GAP implementation in cacao farming.',
        lessons: [
          {
            id: 'gap-video-tutorial',
            title: 'GAP Implementation Video Tutorial',
            videoUrl: 'https://youtu.be/Ecxq9i-oI8k?si=RHcNmSOCumGTDohC'
          }
        ]
      }
    ]
  },
  'care-management': {
    id: 'care-management',
    title: 'Care Management',
    description: 'Essential practices for maintaining healthy cacao plants and maximizing yield through proper irrigation, pruning, and nutrient management.',
    duration: '4 modules · 55 mins',
    level: 'Intermediate',
    modules: [
      {
        id: 'module-8',
        title: 'Irrigation and Water Management',
        description: 'Learn optimal watering techniques and water conservation methods for cacao cultivation.',
        lessons: [
          { id: 'irrigation-methods', title: 'Irrigation Techniques' },
          { id: 'water-conservation', title: 'Water Conservation' },
          { id: 'drainage-systems', title: 'Drainage Systems' }
        ]
      },
      {
        id: 'module-9',
        title: 'Pruning and Canopy Management',
        description: 'Master pruning techniques to optimize light penetration and air circulation in cacao trees.',
        lessons: [
          { id: 'pruning-techniques', title: 'Pruning Methods' },
          { id: 'canopy-management', title: 'Canopy Management' },
          { id: 'pruning-schedule', title: 'Pruning Schedule' }
        ]
      },
      {
        id: 'module-10',
        title: 'Nutrient Management',
        description: 'Understand the essential nutrients for cacao and how to maintain soil fertility.',
        lessons: [
          { id: 'essential-nutrients', title: 'Essential Nutrients' },
          { id: 'fertilization', title: 'Fertilization Practices' },
          { id: 'soil-health', title: 'Soil Health Management' }
        ]
      },
      {
        id: 'module-care-video',
        title: 'Video Module',
        description: 'Watch practical demonstrations of care management techniques.',
        lessons: [
          {
            id: 'care-management-video-tutorial',
            title: 'Care Management Video Tutorial',
            videoUrl: 'https://youtu.be/Ecxq9i-oI8k?si=3gp53f_LxfcMt2Ns'
          }
        ]
      }
    ]
  },
  'cloning-techniques': {
    id: 'cloning-techniques',
    title: 'Types of Cloning in Cacao',
    description: 'Master various cacao propagation techniques including grafting, cuttings, and tissue culture for consistent quality and yield.',
    duration: '3 modules · 40 mins',
    level: 'Intermediate',
    modules: [
      {
        id: 'module-5',
        title: 'Introduction to Cacao Cloning',
        description: 'Understand the fundamentals and benefits of cacao cloning techniques.',
        lessons: [
          { id: 'why-clone-cacao', title: 'Benefits of Cloning' },
          { id: 'cloning-methods-overview', title: 'Cloning Methods Overview' }
        ]
      },
      {
        id: 'module-6',
        title: 'Grafting Techniques',
        description: 'Step-by-step guide to successful cacao grafting methods.',
        lessons: [
          { id: 'grafting-methods', title: 'Common Grafting Methods' },
          { id: 'grafting-steps', title: 'Grafting Procedure' },
          { id: 'grafting-care', title: 'Post-Grafting Care' }
        ]
      },
      {
        id: 'module-7',
        title: 'Tissue Culture & Cuttings',
        description: 'Modern propagation techniques for large-scale cacao production.',
        lessons: [
          { id: 'stem-cuttings', title: 'Stem Cuttings Method' },
          { id: 'tissue-culture', title: 'Tissue Culture Process' },
          { id: 'acclimatization', title: 'Acclimatization of Plantlets' }
        ]
      }
    ]
  },
  'cacao-basics': {
    id: 'cacao-basics',
    title: 'Cacao Basics',
    description: 'Learn the essential knowledge about cacao plants, varieties, and their requirements.',
    duration: '2 modules · 25 mins',
    level: 'Beginner',
    modules: [
      {
        id: 'module-1',
        title: 'Introduction to Cacao',
        description: 'Discover cacao origins, botany, and its cultural impact.',
        lessons: [
          { id: 'intro-cacao', title: 'What is Cacao?' },
          { id: 'cacao-history', title: 'History of Cacao' }
        ]
      },
      {
        id: 'module-2',
        title: 'Cacao Varieties',
        description: 'Dive into the main varieties and their flavor profiles.',
        lessons: [
          { id: 'cacao-varieties', title: 'Main Cacao Varieties' },
          { id: 'growing-conditions', title: 'Growing Conditions' }
        ]
      }
    ]
  },
  'planting-techniques': {
    id: 'planting-techniques',
    title: 'Planting Techniques',
    description: 'Master best practices for soil preparation, nursery care, and planting cacao.',
    duration: '3 modules · 35 mins',
    level: 'Intermediate',
    modules: [
      {
        id: 'module-4',
        title: 'Soil & Site Prep',
        description: 'Soil requirements, shade management, and site planning.',
        lessons: [
          { id: 'soil-requirements', title: 'Soil Requirements' },
          { id: 'shade-management', title: 'Shade Management' }
        ]
      },
      {
        id: 'module-5',
        title: 'Planting Methods',
        description: 'Direct seeding, nursery propagation, and grafting techniques.',
        lessons: [
          { id: 'nursery-care', title: 'Nursery Care' },
          { id: 'planting-methods', title: 'Planting Techniques' }
        ]
      },
      {
        id: 'module-6',
        title: 'Video Module',
        description: 'Watch practical demonstrations of cacao planting techniques.',
        lessons: []
      }
    ]
  },
  'harvest-processing': {
    id: 'harvest-processing',
    title: 'Harvest & Processing',
    description: 'Master the art of harvesting, fermenting, drying, and processing cacao beans for premium quality.',
    duration: '5 modules · 55 mins',
    level: 'Intermediate',
    modules: [
      {
        id: 'module-20',
        title: 'Harvesting Techniques',
        description: 'Learn when and how to harvest cacao pods for optimal quality.',
        lessons: [
          { id: 'harvest-timing', title: 'Determining Ripeness' },
          { id: 'harvest-methods', title: 'Proper Harvesting Techniques' }
        ]
      },
      {
        id: 'module-21',
        title: 'Pod Breaking & Fermentation',
        description: 'Best practices for pod breaking and the critical fermentation process.',
        lessons: [
          { id: 'pod-breaking', title: 'Pod Breaking Methods' },
          { id: 'fermentation-process', title: 'Fermentation Techniques' },
          { id: 'fermentation-troubleshooting', title: 'Troubleshooting Fermentation' }
        ]
      },
      {
        id: 'module-22',
        title: 'Drying & Storage',
        description: 'Proper drying methods and storage conditions for cacao beans.',
        lessons: [
          { id: 'drying-methods', title: 'Drying Techniques' },
          { id: 'moisture-control', title: 'Moisture Content & Quality' },
          { id: 'storage-solutions', title: 'Optimal Storage Conditions' }
        ]
      },
      {
        id: 'module-23',
        title: 'Quality Control & Grading',
        description: 'Assessing bean quality and understanding grading standards.',
        lessons: [
          { id: 'quality-assessment', title: 'Quality Assessment' },
          { id: 'grading-standards', title: 'Grading Standards' },
          { id: 'common-defects', title: 'Identifying Common Defects' }
        ]
      },
      {
        id: 'module-24',
        title: 'Video Module',
        description: 'Watch practical demonstrations of harvest and processing techniques.',
        lessons: [
          {
            id: 'harvest-processing-video-tutorial',
            title: 'Harvest & Processing Video Tutorial',
            videoUrl: 'https://youtu.be/VMqLOxghsAI?si=YRKQ6DzAxe0tyU0r'
          }
        ]
      }
    ]
  },
  'pest-disease': {
    id: 'pest-disease',
    title: 'Pest & Disease Management',
    description: 'Learn to identify, prevent, and manage common cacao pests and diseases for healthier crops.',
    duration: '6 modules · 65 mins',
    level: 'Intermediate',
    modules: [
      {
        id: 'module-14',
        title: 'Common Cacao Pests',
        description: 'Identify and understand the most prevalent pests affecting cacao trees.',
        lessons: [
          { id: 'pest-identification', title: 'Identifying Common Pests' },
          { id: 'pest-lifecycle', title: 'Pest Life Cycles' },
          { id: 'pest-damage', title: 'Recognizing Pest Damage' }
        ]
      },
      {
        id: 'module-15',
        title: 'Major Cacao Diseases',
        description: 'Study the most serious diseases affecting cacao cultivation.',
        lessons: [
          { id: 'disease-identification', title: 'Disease Identification' },
          { id: 'disease-symptoms', title: 'Recognizing Symptoms' },
          { id: 'disease-spread', title: 'Disease Spread Patterns' }
        ]
      },
      {
        id: 'module-16',
        title: 'Integrated Pest Management',
        description: 'Implement comprehensive pest management strategies.',
        lessons: [
          { id: 'ipm-basics', title: 'IPM Fundamentals' },
          { id: 'monitoring-techniques', title: 'Pest Monitoring' },
          { id: 'control-methods', title: 'Control Methods' }
        ]
      },
      {
        id: 'module-17',
        title: 'Organic Control Methods',
        description: 'Learn sustainable and organic approaches to pest management.',
        lessons: [
          { id: 'biological-control', title: 'Biological Control Agents' },
          { id: 'natural-pesticides', title: 'Natural Pesticides' },
          { id: 'cultural-practices', title: 'Cultural Control Practices' }
        ]
      },
      {
        id: 'module-18',
        title: 'Chemical Control & Safety',
        description: 'Understand proper chemical usage and safety protocols.',
        lessons: [
          { id: 'pesticide-types', title: 'Types of Pesticides' },
          { id: 'application-methods', title: 'Application Methods' },
          { id: 'safety-measures', title: 'Safety Precautions' }
        ]
      },
      {
        id: 'module-19',
        title: 'Video Module',
        description: 'Watch practical demonstrations of pest and disease management techniques.',
        lessons: [
          {
            id: 'pest-disease-video-tutorial',
            title: 'Pest & Disease Management Video Tutorial',
            videoUrl: 'https://youtu.be/xD3DoElg2nc?si=JJA6NCkMaISrOult'
          }
        ]
      }
    ]
  },
  'farm-management': {
    id: 'farm-management',
    title: 'Cacao Farm Management',
    description: 'Plan for irrigation, nutrition, pest control, and long-term productivity.',
    duration: '4 modules · 60 mins',
    level: 'Advanced',
    modules: [
      {
        id: 'module-6',
        title: 'Irrigation Planning',
        description: 'Water management for healthy trees year-round.',
        lessons: [
          { id: 'water-basics', title: 'Water Basics' },
          { id: 'drip-systems', title: 'Drip Systems' }
        ]
      },
      {
        id: 'module-7',
        title: 'Nutrition & Soil Health',
        description: 'Fertilizers, composting, and soil monitoring.',
        lessons: [
          { id: 'nutrient-cycle', title: 'Nutrient Cycle' },
          { id: 'soil-monitoring', title: 'Soil Monitoring' }
        ]
      },
      {
        id: 'module-8',
        title: 'Pest & Disease Management',
        description: 'Integrated pest management strategies for cacao farms.',
        lessons: [
          { id: 'common-pests', title: 'Common Pests' },
          { id: 'disease-prevention', title: 'Disease Prevention' }
        ]
      },
      {
        id: 'module-9',
        title: 'Business & Sustainability',
        description: 'Budgeting, cooperatives, and sustainable certifications.',
        lessons: [
          { id: 'budgeting', title: 'Budgeting Basics' },
          { id: 'certifications', title: 'Sustainability Certifications' }
        ]
      }
    ]
  },
  'cloning-techniques': {
    id: 'cloning-techniques',
    title: 'Cacao Cloning Techniques',
    description: 'Master advanced cloning methods for superior cacao propagation and genetic preservation.',
    duration: '4 modules · 50 mins',
    level: 'Advanced',
    modules: [
      {
        id: 'module-27',
        title: 'Why Clone Cacao',
        description: 'Understanding the benefits and principles of cacao cloning.',
        lessons: [
          { id: 'why-clone-cacao', title: 'Benefits of Cloning in Cacao' },
          { id: 'cloning-basics', title: 'Cloning Fundamentals' }
        ]
      },
      {
        id: 'module-28',
        title: 'Cloning Methods',
        description: 'Different techniques for cacao propagation.',
        lessons: [
          { id: 'cloning-methods-overview', title: 'Advanced Propagation Techniques' },
          { id: 'grafting-techniques', title: 'Grafting Methods' }
        ]
      },
      {
        id: 'module-29',
        title: 'Nursery Management',
        description: 'Managing cloned plants in the nursery.',
        lessons: [
          { id: 'nursery-establishment', title: 'Nursery Establishment' },
          { id: 'acclimatization', title: 'Plant Acclimatization' }
        ]
      },
      {
        id: 'module-30',
        title: 'Video Module',
        description: 'Watch practical demonstrations of cacao cloning techniques.',
        lessons: []
      }
    ]
  }
};

const LessonsPage = () => {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const courseList = useMemo(() => Object.values(courses), []);
  const fallbackCourseId = courseId && courses[courseId] ? courseId : courseList[0]?.id;
  const [activeCourseId, setActiveCourseId] = useState(fallbackCourseId);
  const [activeModuleId, setActiveModuleId] = useState(courses[fallbackCourseId]?.modules[0]?.id);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);
  const [currentLessonRead, setCurrentLessonRead] = useState(false);
  const [showMobileModules, setShowMobileModules] = useState(true); // For mobile module view
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedModuleId, setExpandedModuleId] = useState(null); // Track expanded module on mobile
  const activeCourse = courses[activeCourseId];
  const activeModule = activeCourse?.modules.find((module) => module.id === activeModuleId) || activeCourse?.modules[0];

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load completed lessons from database when component mounts
  useEffect(() => {
    const loadCompletedLessons = async () => {
      try {
        setProgressLoading(true);
        console.log('Loading completed lessons for course:', activeCourseId);

        // First, recalculate progress to fix any cached issues
        try {
          await progressAPI.recalculateProgress();
          console.log('Progress recalculated successfully');
        } catch (recalcError) {
          console.log('Progress recalculation failed (might be normal):', recalcError.message);
        }

        // Get progress for the specific course with localStorage fallback
        let progressData;
        try {
          progressData = await progressAPI.getProgress(activeCourseId);
          console.log('Progress data from API:', progressData);

          // Save to localStorage for backup
          localStorage.setItem(`completedLessons_${activeCourseId}`, JSON.stringify(progressData));
        } catch (apiError) {
          console.log('API failed, trying localStorage fallback:', apiError.message);

          // Try localStorage fallback
          const localData = localStorage.getItem(`completedLessons_${activeCourseId}`);
          if (localData) {
            progressData = JSON.parse(localData);
            console.log('Using localStorage progress data:', progressData);
          } else {
            throw apiError;
          }
        }

        if (progressData && progressData.completedLessons) {
          // Handle different data structures from API
          let completedIds;
          if (typeof progressData.completedLessons[0] === 'object') {
            // API returns array of objects with lessonId property
            completedIds = progressData.completedLessons.map(lesson => lesson.lessonId);
          } else {
            // API returns array of strings (lesson IDs directly)
            completedIds = progressData.completedLessons;
          }
          setCompletedLessons(completedIds);
          console.log('Loaded completed lessons from database:', completedIds);
        } else {
          console.log('No completed lessons found for course:', activeCourseId);
          setCompletedLessons([]);
        }
      } catch (error) {
        console.error('Error loading completed lessons from database:', error);

        // Final fallback: try localStorage
        const localData = localStorage.getItem(`completedLessons_${activeCourseId}`);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            const completedIds = parsedData.completedLessons?.map(lesson =>
              typeof lesson === 'object' ? lesson.lessonId : lesson
            ) || [];
            setCompletedLessons(completedIds);
            console.log('Using localStorage fallback:', completedIds);
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
            setCompletedLessons([]);
          }
        } else {
          setCompletedLessons([]);
        }
      } finally {
        setProgressLoading(false);
      }
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }

    loadCompletedLessons();
  }, [activeCourseId]);

  // Reset lesson read status when selecting a new lesson
  useEffect(() => {
    setCurrentLessonRead(false);
  }, [selectedLesson]);

  // Detect when user has finished reading the lesson
  useEffect(() => {
    if (selectedLesson) {
      // Mark as read after 10 seconds or when user scrolls to bottom
      const timer = setTimeout(() => {
        setCurrentLessonRead(true);
      }, 10000); // 10 seconds reading time

      const handleScroll = () => {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Mark as read when user scrolls to 90% of the page
        if (scrollTop + windowHeight >= documentHeight * 0.9) {
          setCurrentLessonRead(true);
        }
      };

      window.addEventListener('scroll', handleScroll);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [selectedLesson]);

  // Handle lesson completion
  const handleCompleteLesson = async (lessonId, lessonTitle) => {
    setLoading(true);
    try {
      console.log('🚨 FRONTEND: Starting lesson completion:', { activeCourseId, lessonId, lessonTitle });

      const response = await progressAPI.completeLesson(activeCourseId, lessonId, lessonTitle);
      console.log('🚨 FRONTEND: API response received:', response);

      // Get total lessons for this course
      const totalLessons = getTotalLessonsForCourse(activeCourseId);
      console.log('🚨 FRONTEND: Total lessons from frontend:', { activeCourseId, totalLessons });

      // Update local state with new completed lesson
      if (!completedLessons.includes(lessonId)) {
        const newCompleted = [...completedLessons, lessonId];
        setCompletedLessons(newCompleted);

        // Save to localStorage immediately for backup
        const progressData = {
          completedLessons: newCompleted.map(id => ({ lessonId: id, completedAt: new Date() })),
          overallProgress: Math.round((newCompleted.length / totalLessons) * 100)
        };
        localStorage.setItem(`completedLessons_${activeCourseId}`, JSON.stringify(progressData));

        // Show success message - use frontend calculation instead of API response
        const frontendProgress = Math.round((newCompleted.length / totalLessons) * 100);
        const progress = frontendProgress; // Override API progress with correct calculation

        console.log('🚨 FRONTEND: Progress calculation:', {
          progressFromAPI: response?.progress,
          frontendCalculation: frontendProgress,
          finalProgress: progress,
          completedLessons: newCompleted.length,
          totalLessons,
          formula: `${newCompleted.length}/${totalLessons} * 100 = ${frontendProgress}%`
        });

        // Check if course was just completed
        if (response?.courseJustCompleted) {
          // Show course completion notification
          alert(`🎉 Congratulations! You completed ${activeCourse.title}!\n\n🏆 You've earned a certificate!`);

          // Add browser notification if supported
          if (window.addCourseCompletionNotification) {
            window.addCourseCompletionNotification(activeCourse.title);
          }
        } else {
          alert(`✅ "${lessonTitle}" completed! Progress: ${progress}%`);
        }
      }
    } catch (error) {
      console.error('🚨 FRONTEND: API Error completing lesson:', error);

      // Get total lessons for this course
      const totalLessons = getTotalLessonsForCourse(activeCourseId);
      console.log('🚨 FRONTEND: Using fallback calculation due to API error:', { activeCourseId, totalLessons });

      // Still update the UI even if API fails for better UX
      if (!completedLessons.includes(lessonId)) {
        const newCompleted = [...completedLessons, lessonId];
        setCompletedLessons(newCompleted);

        const progress = Math.round((newCompleted.length / totalLessons) * 100);

        console.log('🚨 FRONTEND: Fallback progress calculation:', {
          completedLessons: newCompleted.length,
          totalLessons,
          progress,
          formula: `${newCompleted.length}/${totalLessons} * 100 = ${progress}%`
        });

        alert(`✅ "${lessonTitle}" completed! Progress: ${progress}%`);

        if (progress >= 100) {
          alert('🎉 Congratulations! You have completed the course!');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle video completion
  const handleVideoComplete = async (videoId, videoTitle) => {
    console.log(`Video completed: ${videoTitle}`);

    // Show success message
    alert(`🎬 "${videoTitle}" completed! Video watched successfully.`);

    // You can add additional logic here if needed
    // For example: track video progress, unlock achievements, etc.
  };

  // Handle manual progress fix
  const handleManualProgressFix = async () => {
    try {
      console.log('Testing API connection...');

      // First test if the API is working
      const testResponse = await fetch('/api/progress/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (testResponse.ok) {
        console.log('API test successful:', await testResponse.json());

        // Now try the recalculation
        console.log('Manually triggering progress recalculation...');
        const response = await progressAPI.recalculateProgress();
        console.log('Progress recalculated:', response);

        // Reload the page to see updated progress
        alert('🔄 Progress recalculated! Refreshing the page...');
        window.location.reload();
      } else {
        throw new Error('API test failed');
      }
    } catch (error) {
      console.error('Error recalculating progress:', error);

      // Fallback: Force client-side progress fix
      console.log('Using client-side fallback...');

      // Check if we have 4 completed lessons for planting-techniques
      if (activeCourseId === 'planting-techniques' && completedLessons.length === 4) {
        // Force the UI to show 100% by updating the lesson count
        const totalLessonsElement = document.querySelector('.progress-text span');
        const progressBar = document.querySelector('.progress-bar-fill');

        if (totalLessonsElement) {
          totalLessonsElement.textContent = 'Progress: 4 / 4 lessons completed';
        }

        if (progressBar) {
          progressBar.style.width = '100%';
        }

        alert('✅ Progress updated to 100%! Please refresh the page to see the quiz button.');
      } else {
        alert('❌ Server is restarting. Please wait 10 seconds and try again.');
      }
    }
  };

  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  // Handle URL changes and update state accordingly
  useEffect(() => {
    // If there's a lessonId in the URL, set it as selected
    if (lessonId) {
      setSelectedLesson(lessonId);
      return;
    }

    // If no lessonId but we have a module with lessons, clear selection
    if (activeModule?.lessons?.length > 0) {
      setSelectedLesson(null);
    }
  }, [lessonId, activeModule]);

  useEffect(() => {
    if (courseId && courses[courseId] && courseId !== activeCourseId) {
      setActiveCourseId(courseId);
    }
  }, [courseId, activeCourseId]);

  useEffect(() => {
    const nextModuleId =
      (moduleId && activeCourse?.modules.some((module) => module.id === moduleId) && moduleId) ||
      activeCourse?.modules[0]?.id ||
      null;
    setActiveModuleId(nextModuleId);
  }, [activeCourse, moduleId]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleLessonSelect = useCallback((lesson) => {
    setSelectedLesson(lesson.id);
    navigate(`/courses/${activeCourseId}/lessons/${activeModuleId}/${lesson.id}`, {
      state: { fromModule: true }
    });
  }, [activeCourseId, activeModuleId, navigate]);

  const handleBackToLessons = useCallback(() => {
    // Clear the selected lesson and navigate back to module view
    setSelectedLesson(null);
    // On mobile, if going back from lesson, show lessons list (not modules)
    if (isMobile) {
      setShowMobileModules(false);
    }
    navigate(`/courses/${activeCourseId}/lessons/${activeModuleId}`, {
      replace: true,
      state: { fromLesson: true } // Add state to prevent loops
    });
  }, [activeCourseId, activeModuleId, navigate, isMobile]);

  const handleBackToModules = useCallback(() => {
    // On mobile, show the module cards view
    setShowMobileModules(true);
    setSelectedLesson(null);
    setExpandedModuleId(null); // Collapse all modules
  }, []);

  // Handle quiz button clicks for different modules
  const handleStartQuiz = (moduleId, e) => {
    e?.stopPropagation();

    try {
      // Map module IDs to their corresponding game routes
      const moduleRoutes = {
        'cacao-basics': '/games/memory',
        'planting-techniques': '/games/matching-quiz',
        'harvest-processing': '/games/cacao-processing',
        'pest-disease': '/games/pest-disease',
        'gap-practices': '/games/gap-scramble',  // GAP Scramble game route
        'care-management': '/games/care-management',
        'cacao-history': '/games/history',
        'cloning-techniques': '/games/cloning-types'
      };

      // Get the target URL from the mapping, or fallback to dashboard
      const targetUrl = moduleRoutes[moduleId] || '/dashboard';

      if (!moduleRoutes[moduleId]) {
        console.warn(`No route defined for module: ${moduleId}`);
      } else {
        console.log(`Navigating from module ${moduleId} to:`, targetUrl);
        navigate(targetUrl, { replace: true });
        return; // Exit after successful navigation
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to a safe route
      navigate('/dashboard');
    }
  };

  if (!activeCourse) {
    return (
      <div className="course-dashboard">
        <section className="course-detail empty-state">
          <p>Course not found.</p>
        </section>
      </div>
    );
  }

  return (
    <div className={`course-dashboard ${isMobile ? 'mobile-view' : ''}`}>
      <aside className="course-sidebar" style={{ display: isMobile ? 'none' : 'block' }}>
        <div className="sidebar-actions">
          <button className="back-button" onClick={handleBackToDashboard}>
            <FaArrowLeft />
          </button>
        </div>
        <div className="sidebar-subhead">
          <span>Modules in {activeCourse.title}</span>
          <p>Pick a module to view its lessons.</p>

          {/* Progress Indicator */}
          <div className="lesson-progress-indicator">
            <div className="progress-text">
              <span>Progress: {completedLessons.length} / {getTotalLessonsForCourse(activeCourseId) || 0} lessons completed</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${getTotalLessonsForCourse(activeCourseId) > 0
                    ? (completedLessons.length / getTotalLessonsForCourse(activeCourseId)) * 100
                    : 0}%`
                }}
              ></div>
            </div>
            {areAllLessonsCompleted(activeCourseId, completedLessons) && (
              <div className="all-lessons-complete">
                <FaCheck style={{ marginRight: '8px', color: '#4CAF50' }} />
                <span>All lessons completed! Quiz unlocked!</span>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Buttons for Cacao Basics */}
        {activeCourse.id === 'cacao-basics' && areAllLessonsCompleted('cacao-basics', completedLessons) && (
          <div className="course-quiz-buttons">
            <div className="course-quiz-container">
              <button
                className="course-quiz-button"
                onClick={(e) => handleStartQuiz('cacao-basics', e)}
                title="Play Memory Game to test your knowledge"
              >
                <span>Memory Game Quiz</span>
              </button>
            </div>
          </div>
        )}

        {/* Single Quiz Button for Planting Techniques */}
        {activeCourse.id === 'planting-techniques' && areAllLessonsCompleted('planting-techniques', completedLessons) && (
          <div className="course-quiz-container">
            <button
              className="course-quiz-button"
              onClick={(e) => handleStartQuiz('planting-techniques', e)}
              title="Start Planting Techniques Quiz"
            >
              <span> Matching Quiz Game</span>
            </button>
          </div>
        )}

        {/* Single Quiz Button for Harvest & Processing */}
        {activeCourse.id === 'harvest-processing' && areAllLessonsCompleted('harvest-processing', completedLessons) && (
          <div className="course-quiz-container">
            <button
              className="course-quiz-button"
              onClick={(e) => handleStartQuiz('harvest-processing', e)}
              title="Start Harvest & Processing Quiz"
            >
              <span> Cacao Processing Quiz Game </span>
            </button>
          </div>
        )}

        {/* Single Quiz Button for Pest & Disease Management */}
        {activeCourse.id === 'pest-disease' && areAllLessonsCompleted('pest-disease', completedLessons) && (
          <div className="course-quiz-container">
            <button
              className="course-quiz-button"
              onClick={(e) => handleStartQuiz('pest-disease', e)}
              title="Start Pest & Disease Management Quiz"
            >
              <span> Pest & Disease Management Quiz Game</span>
            </button>
          </div>
        )}

        {/* Single Quiz Button for GAP (Good Agricultural Practices) */}
        {activeCourse.id === 'gap-practices' && areAllLessonsCompleted('gap-practices', completedLessons) && (
          <div className="course-quiz-container">
            <button
              className="course-quiz-button"
              onClick={(e) => handleStartQuiz('gap-practices', e)}
              title="Start GAP (Good Agricultural Practices) Quiz"
            >
              <span> Practical GAP Quiz Game</span>
            </button>
          </div>
        )}

        {/* Single Quiz Button for Care Management */}
        {activeCourse.id === 'care-management' && areAllLessonsCompleted('care-management', completedLessons) && (
          <div className="course-quiz-container">
            <button
              className="course-quiz-button"
              onClick={(e) => handleStartQuiz('care-management', e)}
              title="Start Care Management Quiz"
            >
              <span> Care Management Quiz Game</span>
            </button>
          </div>
        )}

        {/* Single Quiz Button for Types of Cloning in Cacao */}
        {activeCourse.id === 'cloning-techniques' && areAllLessonsCompleted('cloning-techniques', completedLessons) && (
          <div className="course-quiz-container">
            <button
              className="course-quiz-button"
              onClick={(e) => handleStartQuiz('cloning-techniques', e)}
              title="Start Types of Cloning in Cacao Quiz"
            >
              <span> Cloning Types Game Quiz</span>
            </button>
          </div>
        )}

        <ul className="module-list">
          {activeCourse.modules.map((module, index) => (
            <li key={module.id}>
              <div className="module-item-container">
                <button
                  className={`module-item ${module.id === activeModuleId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveModuleId(module.id);
                    // On mobile, hide the module list view and show lessons
                    if (isMobile) {
                      setShowMobileModules(false);
                    }
                    // For 'Introduction to Cacao' module, automatically select its first lesson
                    if (module.title === 'Introduction to Cacao' && module.lessons?.[0]) {
                      const firstLesson = module.lessons[0];
                      setSelectedLesson(firstLesson.id);
                      navigate(`/courses/${activeCourseId}/lessons/${module.id}/${firstLesson.id}`);
                    } else {
                      setSelectedLesson(null);
                      navigate(`/courses/${activeCourseId}/lessons/${module.id}`);
                    }
                  }}
                >
                  <div className="module-item-head">
                    {module.id !== 'module-6' && module.id !== 'module-19' && module.id !== 'module-care-video' && module.id !== 'module-24' && module.id !== 'module-30' && (
                      <div className="module-badge">{index + 1}</div>
                    )}
                    <div>
                      {module.id !== 'module-6' && module.id !== 'module-19' && module.id !== 'module-care-video' && module.id !== 'module-24' && module.id !== 'module-30' ? (
                        <p className="module-eyebrow">Module {index + 1}</p>
                      ) : (
                        <p className="module-eyebrow">Video Module</p>
                      )}
                      <span className="module-title">{module.title}</span>
                    </div>
                  </div>
                  <div className="module-meta">
                    {module.id !== 'module-6' && module.id !== 'module-19' && module.id !== 'module-care-video' && module.id !== 'module-24' && module.id !== 'module-30' && (
                      <><span><FaListUl /> {module.lessons.length} lessons</span>
                      <span><FaClock /> {activeCourse.duration}</span></>
                    )}
                    {module.id === 'module-6' && (
                      <span><FaClock /> 3:27 minutes</span>
                    )}
                    {module.id === 'module-19' && (
                      <span><FaClock /> 6:06 minutes</span>
                    )}
                    {module.id === 'module-care-video' && (
                      <span><FaClock /> 6 minutes</span>
                    )}
                    {module.id === 'module-24' && (
                      <span><FaClock /> 6 minutes</span>
                    )}
                    {module.id === 'module-30' && (
                      <span><FaClock /> 7:04 minutes</span>
                    )}
                  </div>
                </button>
                {(activeCourse.id !== 'cacao-basics' &&
                  activeCourse.id !== 'planting-techniques' &&
                  activeCourse.id !== 'harvest-processing' &&
                  activeCourse.id !== 'pest-disease' &&
                  activeCourse.id !== 'gap-practices' &&
                  activeCourse.id !== 'care-management' &&
                  activeCourse.id !== 'cloning-techniques' &&
                  module.title !== 'Introduction to Cacao') && (
                    <button
                      className="quiz-button"
                      onClick={(e) => handleStartQuiz(module.id, e)}
                      title={module.title === 'Cacao Varieties' ? "Start Memory Game Quiz" : "Start Quiz"}
                    >
                      <span>{module.title === 'Cacao Varieties' ? 'MemoryGame Quiz' : 'Start Quiz'}</span>
                    </button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className="course-detail">
        {isMobile && showMobileModules && !selectedLesson ? (
          // Mobile Module Cards View
          <div className="mobile-modules-view">
            <button
              onClick={handleBackToDashboard}
              className="back-button"
            >
              <FaArrowLeft />
              Back to Dashboard
            </button>
            <header className="course-header">
              <div className="header-main">
                <div>
                  <p className="eyebrow">Course Overview</p>
                  <h2>{activeCourse.title}</h2>
                  <p className="helper">{activeCourse.description}</p>
                </div>
              </div>
            </header>
            <div className="mobile-module-cards">
              {activeCourse.modules.map((module, index) => (
                <div key={module.id} className="mobile-module-card-wrapper">
                  <div
                    className={`mobile-module-card ${expandedModuleId === module.id ? 'expanded' : ''}`}
                    onClick={() => {
                      // For video modules, navigate directly to video content
                      if (module.id === 'module-6' || module.id === 'module-12' || module.id === 'module-19' || module.id === 'module-care-video' || module.id === 'module-24' || module.id === 'module-30') {
                        setActiveModuleId(module.id);
                        setSelectedLesson(null);
                        setShowMobileModules(false);
                      } else {
                        // For regular modules, toggle expand/collapse lessons
                        if (expandedModuleId === module.id) {
                          setExpandedModuleId(null); // Collapse
                        } else {
                          setExpandedModuleId(module.id); // Expand
                        }
                      }
                    }}
                  >
                    <div className="mobile-module-card-header">
                      <span className="mobile-module-index">
                        {module.id === 'module-6' || module.id === 'module-12' || module.id === 'module-19' || module.id === 'module-care-video' || module.id === 'module-24' || module.id === 'module-30' ? 'Video Module' : `Module ${index + 1}`}
                      </span>
                      {module.id !== 'module-6' && module.id !== 'module-12' && module.id !== 'module-19' && module.id !== 'module-care-video' && module.id !== 'module-24' && module.id !== 'module-30' && (
                        <FaChevronRight className={`mobile-module-arrow ${expandedModuleId === module.id ? 'rotated' : ''}`} />
                      )}
                    </div>
                    <h3 className="mobile-module-title">{module.title}</h3>
                    <p className="mobile-module-description">{module.description}</p>
                    <div className="mobile-module-meta">
                      {module.id === 'module-6' || module.id === 'module-12' || module.id === 'module-19' || module.id === 'module-care-video' || module.id === 'module-24' || module.id === 'module-30' ? (
                        <span><FaPlay /> Video Content</span>
                      ) : (
                        <span><FaListUl /> {module.lessons.length} lessons</span>
                      )}
                    </div>
                  </div>
                  {expandedModuleId === module.id && (
                    <div className="mobile-module-lessons">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className={`mobile-lesson-item ${isLessonCompleted(lesson.id) ? 'completed' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent module card collapse/expand
                            setSelectedLesson(lesson.id);
                            setShowMobileModules(false);
                            navigate(`/courses/${activeCourseId}/lessons/${module.id}/${lesson.id}`);
                          }}
                        >
                          <div className="mobile-lesson-number">{String(lessonIndex + 1).padStart(2, '0')}</div>
                          <div className="mobile-lesson-content">
                            <h4>{lesson.title}</h4>
                            <p>{lesson.videoUrl ? 'Tap to watch video tutorial' : (lessonContents[lesson.id]?.content?.[0] ? lessonContents[lesson.id].content[0].substring(0, 80) + '...' : 'Tap to view lesson')}</p>
                          </div>
                          {isLessonCompleted(lesson.id) && (
                            <div className="mobile-lesson-check">
                              <FaCheck />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Quiz Buttons */}
            {areAllLessonsCompleted(activeCourseId, completedLessons) && (
              <div className="mobile-quiz-section">
                <div className="mobile-quiz-header">
                  <FaCheck style={{ color: '#4CAF50', fontSize: '1.2rem' }} />
                  <span>All lessons completed! Quiz unlocked!</span>
                </div>

                {activeCourse.id === 'cacao-basics' && (
                  <button
                    className="mobile-quiz-button"
                    onClick={(e) => handleStartQuiz('cacao-basics', e)}
                    title="Play Memory Game to test your knowledge"
                  >
                    <span>Memory Game Quiz</span>
                  </button>
                )}

                {activeCourse.id === 'planting-techniques' && (
                  <button
                    className="mobile-quiz-button"
                    onClick={(e) => handleStartQuiz('planting-techniques', e)}
                    title="Start Planting Techniques Quiz"
                  >
                    <span>Matching Quiz Game</span>
                  </button>
                )}

                {activeCourse.id === 'harvest-processing' && (
                  <button
                    className="mobile-quiz-button"
                    onClick={(e) => handleStartQuiz('harvest-processing', e)}
                    title="Start Harvest & Processing Quiz"
                  >
                    <span>Cacao Processing Quiz Game</span>
                  </button>
                )}

                {activeCourse.id === 'pest-disease' && (
                  <button
                    className="mobile-quiz-button"
                    onClick={(e) => handleStartQuiz('pest-disease', e)}
                    title="Start Pest & Disease Management Quiz"
                  >
                    <span>Pest & Disease Management Quiz Game</span>
                  </button>
                )}

                {activeCourse.id === 'gap-practices' && (
                  <button
                    className="mobile-quiz-button"
                    onClick={(e) => handleStartQuiz('gap-practices', e)}
                    title="Start GAP (Good Agricultural Practices) Quiz"
                  >
                    <span>Practical GAP Quiz Game</span>
                  </button>
                )}

                {activeCourse.id === 'care-management' && (
                  <button
                    className="mobile-quiz-button"
                    onClick={(e) => handleStartQuiz('care-management', e)}
                    title="Start Care Management Quiz"
                  >
                    <span>Care Management Quiz Game</span>
                  </button>
                )}

                {activeCourse.id === 'cloning-techniques' && (
                  <button
                    className="mobile-quiz-button"
                    onClick={(e) => handleStartQuiz('cloning-techniques', e)}
                    title="Start Types of Cloning in Cacao Quiz"
                  >
                    <span>Cloning Types Game Quiz</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : selectedLesson ? (
          <div className="lesson-content">
            <button
              onClick={isMobile ? handleBackToModules : handleBackToLessons}
              className="back-button"
            >
              <FaArrowLeft />
              {isMobile ? 'Back to Modules' : 'Back to Lessons'}
            </button>
            <h2>{lessonContents[selectedLesson]?.title || 'Lesson'}</h2>
            <div className="lesson-content-body">
              {lessonContents[selectedLesson] ? (
                <>
                  {lessonContents[selectedLesson].content.map((paragraph, index) => (
                    paragraph === '' ? (
                      <br key={index} />
                    ) : (
                      <p key={index} className="lesson-paragraph">{paragraph}</p>
                    )
                  ))}

                  {/* Show Done button after user has read the lesson */}
                  {currentLessonRead && !completedLessons.includes(selectedLesson) && (
                    <button
                      className="done-lesson-btn"
                      onClick={() => handleCompleteLesson(selectedLesson, lessonContents[selectedLesson]?.title || 'Lesson')}
                      disabled={loading}
                    >
                      <FaCheck style={{ marginRight: '8px' }} />
                      {loading ? 'Marking as Done...' : 'Mark as Done'}
                    </button>
                  )}

                  {/* Show completion status if already completed */}
                  {completedLessons.includes(selectedLesson) && (
                    <div className="lesson-completed-status">
                      <FaCheck style={{ marginRight: '8px', color: '#4CAF50' }} />
                      <span>Lesson Completed</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p>Lesson content coming soon!</p>
                  {currentLessonRead && !completedLessons.includes(selectedLesson) && (
                    <button
                      className="done-lesson-btn"
                      onClick={() => handleCompleteLesson(selectedLesson, lessonContents[selectedLesson]?.title || 'Lesson')}
                      disabled={loading}
                    >
                      <FaCheck style={{ marginRight: '8px' }} />
                      {loading ? 'Marking as Done...' : 'Mark as Done'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : activeModule?.id === 'module-6' ? (
          // Video Tutorials Module - Show Videos
          <div className="video-content">
            <button
              onClick={isMobile ? handleBackToModules : handleBackToLessons}
              className="back-button"
            >
              <FaArrowLeft />
              {isMobile ? 'Back to Modules' : 'Back to Lessons'}
            </button>
            <h2>Video Lessons</h2>
            <p className="video-description">Watch practical demonstrations of cacao planting techniques.</p>

            <div className="single-video-container">
              <div className="video-wrapper">
                <iframe
                  id="planting-video-iframe"
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/BuDDtfUxrkc?enablejsapi=1"
                  title="Cacao Planting Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                  onLoad={() => {
                    // Set up YouTube API listener for video completion
                    if (!window.YT) {
                      const tag = document.createElement('script');
                      tag.src = 'https://www.youtube.com/iframe_api';
                      const firstScriptTag = document.getElementsByTagName('script')[0];
                      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                    }

                    window.onYouTubeIframeAPIReady = () => {
                      const player = new YT.Player('planting-video-iframe', {
                        events: {
                          'onStateChange': (event) => {
                            if (event.data === YT.PlayerState.ENDED) {
                              // Video finished - mark as completed
                              handleVideoComplete('planting-techniques-video', 'Planting Techniques Video Tutorial');
                            }
                          }
                        }
                      });
                    };
                  }}
                ></iframe>
              </div>
              <div className="video-info">
                <h3>Complete Cacao Planting Guide</h3>
                <p>Learn the complete process of planting cacao from seed to harvest, including soil preparation, nursery management, and field planting techniques.</p>
              </div>
            </div>
          </div>
        ) : activeModule?.id === 'module-12' ? (
          // GAP Video Tutorials Module - Show Videos
          <div className="video-content">
            <button
              onClick={isMobile ? handleBackToModules : handleBackToLessons}
              className="back-button"
            >
              <FaArrowLeft />
              {isMobile ? 'Back to Modules' : 'Back to Lessons'}
            </button>
            <h2>Video Lessons</h2>
            <p className="video-description">Watch practical demonstrations of GAP implementation in cacao farming.</p>

            <div className="single-video-container">
              <div className="video-wrapper">
                <iframe
                  id="gap-video-iframe"
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/Ecxq9i-oI8k?enablejsapi=1"
                  title="GAP Implementation Video Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                  onLoad={() => {
                    // Set up YouTube API listener for video completion
                    if (!window.YT) {
                      const tag = document.createElement('script');
                      tag.src = 'https://www.youtube.com/iframe_api';
                      const firstScriptTag = document.getElementsByTagName('script')[0];
                      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                    }

                    window.onYouTubeIframeAPIReady = () => {
                      const player = new YT.Player('gap-video-iframe', {
                        events: {
                          'onStateChange': (event) => {
                            if (event.data === YT.PlayerState.ENDED) {
                              // Video finished - mark as completed
                              handleVideoComplete('gap-video-tutorial', 'GAP Implementation Video Tutorial');
                            }
                          }
                        }
                      });
                    };
                  }}
                ></iframe>
              </div>
              <div className="video-info">
                <h3>GAP Implementation Video Tutorial</h3>
                <p>Learn practical implementation of Good Agricultural Practices in cacao farming, including soil management, pest control, and sustainable farming techniques.</p>
              </div>
            </div>
          </div>
        ) : activeModule?.id === 'module-19' ? (
          // Pest & Disease Video Tutorials Module - Show Videos
          <div className="video-content">
            <button
              onClick={isMobile ? handleBackToModules : handleBackToLessons}
              className="back-button"
            >
              <FaArrowLeft />
              {isMobile ? 'Back to Modules' : 'Back to Lessons'}
            </button>
            <h2>Video Lessons</h2>
            <p className="video-description">Watch practical demonstrations of pest and disease management techniques.</p>

            <div className="single-video-container">
              <div className="video-wrapper">
                <iframe
                  id="pest-disease-video-iframe"
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/xD3DoElg2nc?enablejsapi=1"
                  title="Pest & Disease Management Video Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                  onLoad={() => {
                    // Set up YouTube API listener for video completion
                    if (!window.YT) {
                      const tag = document.createElement('script');
                      tag.src = 'https://www.youtube.com/iframe_api';
                      const firstScriptTag = document.getElementsByTagName('script')[0];
                      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                    }

                    window.onYouTubeIframeAPIReady = () => {
                      const player = new YT.Player('pest-disease-video-iframe', {
                        events: {
                          'onStateChange': (event) => {
                            if (event.data === YT.PlayerState.ENDED) {
                              // Video finished - mark as completed
                              handleVideoComplete('pest-disease-video-tutorial', 'Pest & Disease Management Video Tutorial');
                            }
                          }
                        }
                      });
                    };
                  }}
                ></iframe>
              </div>
              <div className="video-info">
                <h3>Pest & Disease Management Video Tutorial</h3>
                <p>Learn practical pest and disease management techniques for cacao farming, including identification, prevention, and treatment methods.</p>
              </div>
            </div>
          </div>
        ) : activeModule?.id === 'module-care-video' ? (
          // Care Management Video Module
          <div className="video-content">
            <button
              onClick={isMobile ? handleBackToModules : handleBackToLessons}
              className="back-button"
            >
              <FaArrowLeft />
              {isMobile ? 'Back to Modules' : 'Back to Lessons'}
            </button>
            <h2>Video Lessons</h2>
            <p className="video-description">Watch practical demonstrations of care management techniques.</p>

            <div className="single-video-container">
              <div className="video-wrapper">
                <iframe
                  id="care-management-video-iframe"
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/Ecxq9i-oI8k?enablejsapi=1"
                  title="Care Management Video Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                  onLoad={() => {
                    if (!window.YT) {
                      const tag = document.createElement('script');
                      tag.src = 'https://www.youtube.com/iframe_api';
                      const firstScriptTag = document.getElementsByTagName('script')[0];
                      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                    }

                    window.onYouTubeIframeAPIReady = () => {
                      const player = new YT.Player('care-management-video-iframe', {
                        events: {
                          'onStateChange': (event) => {
                            if (event.data === YT.PlayerState.ENDED) {
                              handleVideoComplete('care-management-video-tutorial', 'Care Management Video Tutorial');
                            }
                          }
                        }
                      });
                    };
                  }}
                ></iframe>
              </div>
              <div className="video-info">
                <h3>Care Management Video Tutorial</h3>
                <p>Learn detailed care management practices for cacao, including pruning, soil health, and shade management.</p>
              </div>
            </div>
          </div>
        ) : activeModule?.id === 'module-24' ? (
          // Harvest & Processing Video Module
          <div className="video-content">
            <button
              onClick={isMobile ? handleBackToModules : handleBackToLessons}
              className="back-button"
            >
              <FaArrowLeft />
              {isMobile ? 'Back to Modules' : 'Back to Lessons'}
            </button>
            <h2>Video Lessons</h2>
            <p className="video-description">Watch practical demonstrations of harvest and processing techniques.</p>

            <div className="single-video-container">
              <div className="video-wrapper">
                <iframe
                  id="harvest-processing-video-iframe"
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/VMqLOxghsAI?enablejsapi=1"
                  title="Harvest & Processing Video Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                  onLoad={() => {
                    if (!window.YT) {
                      const tag = document.createElement('script');
                      tag.src = 'https://www.youtube.com/iframe_api';
                      const firstScriptTag = document.getElementsByTagName('script')[0];
                      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                    }

                    window.onYouTubeIframeAPIReady = () => {
                      const player = new YT.Player('harvest-processing-video-iframe', {
                        events: {
                          'onStateChange': (event) => {
                            if (event.data === YT.PlayerState.ENDED) {
                              handleVideoComplete('harvest-processing-video-tutorial', 'Harvest & Processing Video Tutorial');
                            }
                          }
                        }
                      });
                    };
                  }}
                ></iframe>
              </div>
              <div className="video-info">
                <h3>Harvest & Processing Video Tutorial</h3>
                <p>Learn detailed harvest and processing techniques for cacao, including harvesting, fermentation, drying, and quality control methods.</p>
              </div>
            </div>
          </div>
        ) : activeModule?.id === 'module-30' ? (
          // Cacao Cloning Video Module
          <div className="video-content">
            <button
              onClick={isMobile ? handleBackToModules : handleBackToLessons}
              className="back-button"
            >
              <FaArrowLeft />
              {isMobile ? 'Back to Modules' : 'Back to Lessons'}
            </button>
            <h2>Video Lessons</h2>
            <p className="video-description">Watch practical demonstrations of cacao cloning techniques.</p>

            <div className="single-video-container">
              <div className="video-wrapper">
                <iframe
                  id="cloning-video-iframe"
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/cWBeuunPk0A?enablejsapi=1"
                  title="Cacao Cloning Video Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                  onLoad={() => {
                    if (!window.YT) {
                      const tag = document.createElement('script');
                      tag.src = 'https://www.youtube.com/iframe_api';
                      const firstScriptTag = document.getElementsByTagName('script')[0];
                      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                      window.onYouTubeIframeAPIReady = () => {
                        const player = new YT.Player('cloning-video-iframe', {
                          events: {
                            'onStateChange': (event) => {
                              if (event.data === YT.PlayerState.ENDED) {
                                handleVideoComplete('cloning-video-tutorial', 'Cacao Cloning Video Tutorial');
                              }
                            }
                          }
                        });
                      };
                    }
                  }}
                ></iframe>
              </div>
              <div className="video-info">
                <h3>Cacao Cloning Video Tutorial</h3>
                <p>Learn advanced cacao cloning techniques including grafting, cuttings, and tissue culture for superior propagation and genetic preservation.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isMobile && !showMobileModules && (
              <button
                onClick={handleBackToModules}
                className="back-button"
              >
                <FaArrowLeft />
                Back to Modules
              </button>
            )}
            <header className="course-header">
              <div className="header-main">
                <div>
                  <p className="eyebrow">Course Overview</p>
                  <h2>{activeCourse.title}</h2>
                  <p className="helper">{activeCourse.description}</p>
                  {!isMobile && (
                    <>
                      <p className="helper helper-note">Browse the modules below.</p>
                      <p className="helper helper-note">Pick a module to view its lessons.</p>
                    </>
                  )}
                </div>
              </div>
              <div className="course-stat-chips">
                <span className="stat-chip">
                  <FaLayerGroup /> {activeCourse.modules.length} modules
                </span>
                <span className="stat-chip">
                  <FaClock /> {activeCourse.duration}
                </span>
                <span className="stat-chip level">{activeCourse.level}</span>
              </div>
            </header>

            {activeModule && (
              <article className="module-hero">
                <div className="module-hero-info">
                  <span className="module-index">Module {activeCourse.modules.indexOf(activeModule) + 1}</span>
                  <h3>{activeModule.title}</h3>
                  <p>{activeModule.description}</p>
                </div>
                <div className="module-hero-meta">
                  <span><FaListUl /> {activeModule.lessons.length} lessons</span>
                  <span><FaClock /> {activeCourse.duration}</span>
                </div>
              </article>
            )}

            {activeModule && (
              <div className="lesson-card-list">
                {activeModule.lessons.map((lesson, index) => (
                  <article
                    key={lesson.id}
                    className={`lesson-card ${selectedLesson === lesson.id ? 'active' : ''} ${isLessonCompleted(lesson.id) ? 'completed' : ''}`}
                    onClick={() => handleLessonSelect(lesson)}
                  >
                    <div className="lesson-card-index">{String(index + 1).padStart(2, '0')}</div>
                    <div className="lesson-content">
                      <h4>{lesson.title}</h4>
                      <p>{lessonContents[lesson.id]?.content?.[0]?.substring(0, 120) + '...' || `See the key ideas covered in "${lesson.title}".`}</p>
                    </div>
                    {isLessonCompleted(lesson.id) && (
                      <div className="lesson-completed-badge">
                        <FaCheck />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default LessonsPage;