import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBook, FaCheckCircle, FaLock, FaPlay, FaTrophy, FaClock } from 'react-icons/fa';
import courses from '../data/courses';
import { progressAPI } from './services/progressAPI';
import './LessonsPage.css';

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
    'cacao-basics': ['cacao-history', 'cacao-varieties', 'growing-conditions', 'cacao-anatomy'],
    'planting-techniques': ['seed-selection', 'nursery-management', 'field-preparation', 'planting-methods'],
    'care-management': ['irrigation-management', 'fertilization', 'pruning-techniques', 'pest-monitoring', 'disease-control', 'harvest-timing', 'post-harvest-care', 'sustainability'],
    'harvest-processing': ['harvesting-basics', 'pod-breaking', 'fermentation-process', 'drying-methods', 'quality-control', 'storage-techniques', 'grading-systems', 'packaging-standards', 'shipping-methods', 'processing-timeline', 'quality-assurance'],
    'pest-disease': ['identification-basics', 'common-pests', 'fungal-diseases', 'viral-infections', 'bacterial-issues', 'integrated-management', 'chemical-controls', 'organic-solutions', 'prevention-strategies', 'monitoring-techniques', 'treatment-methods', 'resistance-management', 'environmental-factors', 'economic-impact', 'case-studies'],
    'cloning-techniques': ['cloning-basics', 'grafting-methods', 'budding-techniques', 'tissue-culture', 'rootstock-selection', 'success-rates'],
    'gap-practices': ['gap-introduction', 'sustainability-principles', 'certification-standards']
  };
  
  return courseLessons[courseId] || [];
};

// Helper function to check if all lessons are completed
const areAllLessonsCompleted = (courseId, completedLessons) => {
  const allLessonIds = getAllLessonIdsForCourse(courseId);
  const totalLessons = getTotalLessonsForCourse(courseId);
  return completedLessons.length >= totalLessons;
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
  const [courseProgress, setCourseProgress] = useState(0);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const activeCourse = courses[activeCourseId];
  const activeModule = activeCourse?.modules.find((module) => module.id === activeModuleId) || activeCourse?.modules[0];
  
  // Ref to track if progress has been loaded
  const progressLoadedRef = useRef(false);
  
  // Load completed lessons from database when component mounts
  useEffect(() => {
    const loadCompletedLessons = async () => {
      // Prevent multiple loads
      if (progressLoadedRef.current) {
        console.log('🔒 Progress already loaded, skipping...');
        return;
      }
      
      try {
        setProgressLoading(true);
        console.log('🔄 Loading completed lessons from database for course:', activeCourseId);
        
        const progressData = await progressAPI.getProgress(activeCourseId);
        console.log('📊 Progress data received:', progressData);
        
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
          
          // Only update if the data is different to prevent unnecessary re-renders
          const currentLessonsStr = JSON.stringify(completedLessons.sort());
          const newLessonsStr = JSON.stringify(completedIds.sort());
          
          if (currentLessonsStr !== newLessonsStr) {
            setCompletedLessons(completedIds);
            console.log('✅ Updated completed lessons from database:', completedIds);
          } else {
            console.log('📋 Completed lessons unchanged:', completedIds);
          }
          
          // Update course progress
          const totalLessons = getTotalLessonsForCourse(activeCourseId);
          const progress = Math.round((completedIds.length / totalLessons) * 100);
          setCourseProgress(progress);
          setIsCourseCompleted(progress >= 100);
          
        } else {
          console.log('📭 No completed lessons found for course:', activeCourseId);
          // Only set to empty if current state is not already empty
          if (completedLessons.length > 0) {
            setCompletedLessons([]);
            setCourseProgress(0);
            setIsCourseCompleted(false);
          }
        }
        
        progressLoadedRef.current = true;
        
      } catch (error) {
        console.error('❌ Error loading completed lessons from database:', error);
        // Don't reset to empty on error, keep current state
      } finally {
        setProgressLoading(false);
      }
    };
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
    
    loadCompletedLessons();
  }, [activeCourseId]);
  
  // Reset progress loaded flag when course changes
  useEffect(() => {
    progressLoadedRef.current = false;
  }, [activeCourseId]);
  
  // Reset lesson read status when selecting a new lesson
  useEffect(() => {
    setCurrentLessonRead(false);
  }, [selectedLesson]);
  
  // Detect when user has finished reading the lesson
  useEffect(() => {
    if (selectedLesson) {
      // Mark as read after 10 seconds or when user scrolls to bottom
      const readTimer = setTimeout(() => {
        if (!currentLessonRead) {
          setCurrentLessonRead(true);
          console.log('📖 Lesson marked as read after 10 seconds');
        }
      }, 10000);
      
      // Also detect scroll to bottom
      const handleScroll = () => {
        const scrollElement = document.querySelector('.lesson-content');
        if (scrollElement) {
          const { scrollTop, scrollHeight, clientHeight } = scrollElement;
          if (scrollTop + clientHeight >= scrollHeight - 50) {
            if (!currentLessonRead) {
              setCurrentLessonRead(true);
              console.log('📖 Lesson marked as read (scroll to bottom)');
            }
          }
        }
      };
      
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        clearTimeout(readTimer);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [selectedLesson, currentLessonRead]);
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleModuleSelect = (moduleId) => {
    setActiveModuleId(moduleId);
    setSelectedLesson(null);
    setCurrentLessonRead(false);
  };
  
  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
    setCurrentLessonRead(false);
  };
  
  const handleCompleteLesson = async () => {
    if (!selectedLesson || !currentLessonRead) {
      alert('Please read the lesson before marking it as complete.');
      return;
    }
    
    try {
      setLoading(true);
      const lessonId = selectedLesson.id;
      const lessonTitle = selectedLesson.title;
      
      console.log('🚨 FRONTEND: Starting lesson completion:', { activeCourseId, lessonId, lessonTitle });
      
      // Call API to complete lesson
      const response = await progressAPI.completeLesson(activeCourseId, lessonId, lessonTitle);
      console.log('🚨 FRONTEND: API response received:', response);
      
      // Get total lessons for this course
      const totalLessons = getTotalLessonsForCourse(activeCourseId);
      console.log('🚨 FRONTEND: Total lessons from frontend:', { activeCourseId, totalLessons });
      
      // Update local state with new completed lesson
      if (!completedLessons.includes(lessonId)) {
        const newCompleted = [...completedLessons, lessonId];
        setCompletedLessons(newCompleted);
        
        // Update course progress
        const progress = Math.round((newCompleted.length / totalLessons) * 100);
        setCourseProgress(progress);
        setIsCourseCompleted(progress >= 100);
        
        // Show success message
        console.log('🚨 FRONTEND: Progress calculation:', {
          progressFromAPI: response?.progress,
          frontendCalculation: progress,
          finalProgress: progress,
          completedLessons: newCompleted.length,
          totalLessons,
          formula: `${newCompleted.length}/${totalLessons} * 100 = ${progress}%`
        });
        
        // Show success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Lesson Completed!', {
            body: `${lessonTitle} - Progress: ${progress}%`,
            icon: '/favicon.ico'
          });
        }
        
        // Move to next lesson or show completion
        const currentModule = activeCourse?.modules.find(m => m.id === activeModuleId);
        const currentLessonIndex = currentModule?.lessons.findIndex(l => l.id === lessonId);
        
        if (currentLessonIndex !== undefined && currentLessonIndex < currentModule.lessons.length - 1) {
          // Move to next lesson in same module
          const nextLesson = currentModule.lessons[currentLessonIndex + 1];
          handleLessonSelect(nextLesson);
        } else {
          // Check if there are more modules
          const currentModuleIndex = activeCourse?.modules.findIndex(m => m.id === activeModuleId);
          if (currentModuleIndex !== undefined && currentModuleIndex < activeCourse.modules.length - 1) {
            // Move to next module
            const nextModule = activeCourse.modules[currentModuleIndex + 1];
            setActiveModuleId(nextModule.id);
            if (nextModule.lessons.length > 0) {
              handleLessonSelect(nextModule.lessons[0]);
            }
          } else {
            // Course completed
            setSelectedLesson(null);
            alert(`🎉 Congratulations! You've completed the ${activeCourse.title} course! Progress: ${progress}%`);
          }
        }
      } else {
        console.log('📚 Lesson already completed, skipping');
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
        setCourseProgress(progress);
        setIsCourseCompleted(progress >= 100);
        
        console.log('🚨 FRONTEND: Fallback progress calculation:', {
          completedLessons: newCompleted.length,
          totalLessons,
          progress,
          formula: `${newCompleted.length}/${totalLessons} * 100 = ${progress}%`
        });
        
        alert('Lesson marked as complete (offline mode). Progress will sync when connection is restored.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuizAccess = () => {
    if (!isCourseCompleted) {
      alert(`🔒 Quiz Locked! Complete all lessons first.\n\nProgress: ${courseProgress}%\nCompleted: ${completedLessons.length}/${getTotalLessonsForCourse(activeCourseId)} lessons`);
      return;
    }
    
    // Navigate to quiz game based on course
    const quizRoutes = {
      'cacao-basics': '/quiz/cacao-history',
      'care-management': '/quiz/care-management',
      'planting-techniques': '/quiz/planting-techniques',
      'harvest-processing': '/quiz/cacao-processing',
      'pest-disease': '/quiz/pest-disease',
      'cloning-techniques': '/quiz/cloning-types',
      'gap-practices': '/quiz/gap-scramble'
    };
    
    const quizRoute = quizRoutes[activeCourseId];
    if (quizRoute) {
      navigate(quizRoute);
    } else {
      alert('Quiz not available for this course yet.');
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
    <div className="course-dashboard">
      <aside className="course-sidebar">
        <div className="sidebar-actions">
          <button className="back-button" onClick={handleBackToDashboard}>
            Back to Dashboard
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
        
        <div className="course-modules">
          <h3>Course Modules</h3>
          {activeCourse.modules.map((module) => (
            <div 
              key={module.id}
              className={`module-item ${activeModuleId === module.id ? 'active' : ''}`}
              onClick={() => handleModuleSelect(module.id)}
            >
              <h4>{module.title}</h4>
              <p>{module.lessons.length} lessons</p>
            </div>
          ))}
        </div>
        
        {/* Quiz Access Button */}
        <div className="quiz-access-section">
          <button 
            className={`quiz-button ${isCourseCompleted ? 'unlocked' : 'locked'}`}
            onClick={handleQuizAccess}
          >
            {isCourseCompleted ? (
              <>
                <FaTrophy style={{ marginRight: '8px' }} />
                Take Quiz
              </>
            ) : (
              <>
                <FaLock style={{ marginRight: '8px' }} />
                Quiz Locked
              </>
            )}
          </button>
          {!isCourseCompleted && (
            <p className="quiz-requirement">
              Complete all lessons to unlock the quiz
            </p>
          )}
        </div>
      </aside>
      
      <main className="course-main">
        {selectedLesson ? (
          <div className="lesson-detail">
            <div className="lesson-header">
              <h2>{selectedLesson.title}</h2>
              <div className="lesson-meta">
                <span className="duration">
                  <FaClock style={{ marginRight: '4px' }} />
                  {selectedLesson.duration || '10 min read'}
                </span>
                <span className="status">
                  {currentLessonRead ? (
                    <><FaCheckCircle style={{ marginRight: '4px', color: '#4CAF50' }} /> Read</>
                  ) : (
                    <><FaBook style={{ marginRight: '4px' }} /> Reading...</>
                  )}
                </span>
              </div>
            </div>
            
            <div className="lesson-content">
              <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
            </div>
            
            <div className="lesson-actions">
              <button 
                className={`complete-button ${currentLessonRead ? 'enabled' : 'disabled'}`}
                onClick={handleCompleteLesson}
                disabled={loading || !currentLessonRead}
              >
                {loading ? (
                  'Marking as Complete...'
                ) : currentLessonRead ? (
                  'Mark as Complete'
                ) : (
                  'Please read the lesson first'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="module-lessons">
            <div className="module-header">
              <h2>{activeModule?.title || 'Select a Module'}</h2>
              <p>{activeModule?.description || 'Choose a module from the sidebar to view its lessons.'}</p>
            </div>
            
            {activeModule?.lessons.map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.id);
              return (
                <div 
                  key={lesson.id}
                  className={`lesson-item ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleLessonSelect(lesson)}
                >
                  <div className="lesson-info">
                    <h3>{lesson.title}</h3>
                    <p>{lesson.description}</p>
                    <span className="duration">{lesson.duration || '10 min'}</span>
                  </div>
                  <div className="lesson-status">
                    {isCompleted ? (
                      <FaCheckCircle style={{ color: '#4CAF50', fontSize: '24px' }} />
                    ) : (
                      <FaPlay style={{ color: '#2196F3', fontSize: '24px' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default LessonsPage;
