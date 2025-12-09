import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaTrophy, FaCheckCircle, FaClock, FaPlay } from 'react-icons/fa';
import { progressAPI } from '../services/progressAPI';

const QuizAccessControl = ({ courseId, quizName, quizRoute }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);

  // Course lesson counts
  const courseLessonCounts = {
    'cacao-basics': 4,
    'planting-techniques': 4,
    'care-management': 9,
    'harvest-processing': 11,
    'pest-disease': 15,
    'cloning-techniques': 6,
    'gap-practices': 3
  };

  useEffect(() => {
    const checkCourseProgress = async () => {
      try {
        setLoading(true);
        
        // Get course progress from API
        const progressData = await progressAPI.getProgress(courseId);
        console.log('🔍 Quiz Access Control - Progress data:', progressData);
        
        if (progressData && progressData.completedLessons) {
          // Handle different data structures
          let completedIds;
          if (typeof progressData.completedLessons[0] === 'object') {
            completedIds = progressData.completedLessons.map(lesson => lesson.lessonId);
          } else {
            completedIds = progressData.completedLessons;
          }
          
          setCompletedLessons(completedIds);
          
          const total = courseLessonCounts[courseId] || 4;
          setTotalLessons(total);
          
          const progress = Math.round((completedIds.length / total) * 100);
          setCourseProgress(progress);
          setIsCourseCompleted(progress >= 100);
          
          console.log('📊 Quiz Access Control - Calculated:', {
            courseId,
            completedLessons: completedIds.length,
            totalLessons: total,
            progress,
            isCourseCompleted: progress >= 100
          });
        } else {
          setCourseProgress(0);
          setCompletedLessons([]);
          setIsCourseCompleted(false);
        }
        
      } catch (error) {
        console.error('❌ Error checking course progress for quiz access:', error);
        setCourseProgress(0);
        setCompletedLessons([]);
        setIsCourseCompleted(false);
      } finally {
        setLoading(false);
      }
    };

    checkCourseProgress();
  }, [courseId]);

  const handleQuizAccess = () => {
    if (!isCourseCompleted) {
      alert(`🔒 Quiz Locked!\n\nYou must complete all lessons first.\n\n📚 Progress: ${courseProgress}%\n✅ Completed: ${completedLessons.length}/${totalLessons} lessons\n\nKeep learning to unlock the quiz! 🎯`);
      return;
    }

    // Navigate to quiz
    navigate(quizRoute);
  };

  const handleBackToLessons = () => {
    navigate(`/courses/${courseId}/lessons`);
  };

  if (loading) {
    return (
      <div className="quiz-access-control loading">
        <div className="loading-spinner">
          <FaClock className="spinning" />
          <p>Checking course progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-access-control">
      <div className="access-card">
        <div className="quiz-header">
          <h1>{quizName}</h1>
          <p className="quiz-description">Test your knowledge and earn your certificate!</p>
        </div>

        <div className="progress-section">
          <h3>Course Progress Required</h3>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${courseProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            <span>{courseProgress}% Complete</span>
            <span>{completedLessons.length}/{totalLessons} Lessons</span>
          </div>
        </div>

        {isCourseCompleted ? (
          <div className="access-granted">
            <div className="success-message">
              <FaTrophy className="trophy-icon" />
              <h2>Quiz Unlocked! 🎉</h2>
              <p>Congratulations! You've completed all lessons and can now take the quiz.</p>
            </div>
            
            <div className="quiz-stats">
              <div className="stat-item">
                <FaCheckCircle className="stat-icon completed" />
                <span>{completedLessons.length} Lessons Completed</span>
              </div>
              <div className="stat-item">
                <FaTrophy className="stat-icon trophy" />
                <span>Quiz Available</span>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="quiz-button start-quiz"
                onClick={handleQuizAccess}
              >
                <FaPlay style={{ marginRight: '8px' }} />
                Start Quiz
              </button>
              <button 
                className="back-button"
                onClick={handleBackToLessons}
              >
                Back to Lessons
              </button>
            </div>
          </div>
        ) : (
          <div className="access-denied">
            <div className="lock-message">
              <FaLock className="lock-icon" />
              <h2>Quiz Locked 🔒</h2>
              <p>Complete all lessons to unlock this quiz.</p>
            </div>
            
            <div className="requirements">
              <h3>Requirements:</h3>
              <div className="requirement-list">
                <div className={`requirement-item ${completedLessons.length >= totalLessons ? 'met' : 'unmet'}`}>
                  <FaCheckCircle className={`check-icon ${completedLessons.length >= totalLessons ? 'completed' : 'uncompleted'}`} />
                  <span>Complete all {totalLessons} lessons</span>
                  <span className="requirement-status">
                    {completedLessons.length}/{totalLessons}
                  </span>
                </div>
              </div>
            </div>

            <div className="remaining-lessons">
              <h3>Remaining Lessons: {totalLessons - completedLessons.length}</h3>
              <p>Keep learning to unlock the quiz! You're doing great! 💪</p>
            </div>

            <div className="action-buttons">
              <button 
                className="back-button primary"
                onClick={handleBackToLessons}
              >
                <FaPlay style={{ marginRight: '8px' }} />
                Continue Learning
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .quiz-access-control {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading {
          background: white;
          border-radius: 15px;
          padding: 40px;
          text-align: center;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .spinning {
          animation: spin 2s linear infinite;
          font-size: 48px;
          color: #667eea;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .access-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .quiz-header h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2.5em;
        }

        .quiz-description {
          color: #666;
          font-size: 1.1em;
        }

        .progress-section {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .progress-section h3 {
          color: #333;
          margin-bottom: 15px;
          text-align: center;
        }

        .progress-bar-container {
          background: #e9ecef;
          height: 20px;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #45a049);
          transition: width 0.3s ease;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          color: #666;
          font-weight: 500;
        }

        .access-granted {
          text-align: center;
        }

        .success-message {
          margin-bottom: 30px;
        }

        .trophy-icon {
          font-size: 64px;
          color: #FFD700;
          margin-bottom: 20px;
        }

        .success-message h2 {
          color: #4CAF50;
          margin-bottom: 10px;
        }

        .quiz-stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 30px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #666;
        }

        .stat-icon.completed {
          color: #4CAF50;
        }

        .stat-icon.trophy {
          color: #FFD700;
        }

        .access-denied {
          text-align: center;
        }

        .lock-message {
          margin-bottom: 30px;
        }

        .lock-icon {
          font-size: 48px;
          color: #dc3545;
          margin-bottom: 20px;
        }

        .lock-message h2 {
          color: #dc3545;
          margin-bottom: 10px;
        }

        .requirements {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .requirements h3 {
          color: #856404;
          margin-bottom: 15px;
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
        }

        .check-icon.completed {
          color: #4CAF50;
        }

        .check-icon.uncompleted {
          color: #dc3545;
        }

        .requirement-status {
          margin-left: auto;
          font-weight: bold;
          color: #666;
        }

        .remaining-lessons {
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .remaining-lessons h3 {
          color: #0c5460;
          margin-bottom: 10px;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .quiz-button {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 10px;
          font-size: 1.1em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
        }

        .quiz-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(76, 175, 80, 0.3);
        }

        .back-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 10px;
          font-size: 1.1em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
        }

        .back-button:hover {
          background: #5a6268;
          transform: translateY(-2px);
        }

        .back-button.primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .back-button.primary:hover {
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        @media (max-width: 768px) {
          .access-card {
            padding: 30px 20px;
          }

          .quiz-stats {
            flex-direction: column;
            gap: 15px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .quiz-button, .back-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizAccessControl;
