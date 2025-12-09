import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRedo, FaCheck, FaTimes, FaInfoCircle, FaLeaf, FaTint, FaBug, FaTree } from 'react-icons/fa';
import './CareManagementGame.css';
import CongratsPopup from '../components/CongratsPopup';
import quizScoreAPI from '../services/quizScoreAPI';

const CareManagementGame = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false });
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  
  // Audio refs
  const backgroundMusicRef = useRef(null);
  const correctSoundRef = useRef(null);
  const incorrectSoundRef = useRef(null);
  const clickSoundRef = useRef(null);
  const gameOverSoundRef = useRef(null);
  const timeUpSoundRef = useRef(null);

  // Questions about cacao care management
  const allQuestions = [
    {
      question: 'What is the ideal frequency for watering young cacao plants?',
      options: [
        'Once a day',
        'Twice a week',
        'Once a month',
        'Only when the soil is dry to touch'
      ],
      correct: 3,
      explanation: 'Young cacao plants need consistent moisture but are susceptible to root rot. Water when the top inch of soil is dry.'
    },
    {
      question: 'Which of these is a common pest that affects cacao plants?',
      options: [
        'Aphids',
        'Cocoa pod borer',
        'Spider mites',
        'All of the above'
      ],
      correct: 3,
      explanation: 'All these pests can affect cacao plants, with the cocoa pod borer being particularly devastating to yields.'
    },
    {
      question: 'What is the best time of day to apply fertilizer to cacao trees?',
      options: [
        'Midday when sun is strongest',
        'Early morning or late afternoon',
        'During rain',
        'At night'
      ],
      correct: 1,
      explanation: 'Early morning or late afternoon is best to avoid leaf burn and ensure proper absorption.'
    },
    {
      question: 'How often should cacao trees be pruned?',
      options: [
        'Never',
        'Once a year',
        'Every 2-3 months',
        'Every week'
      ],
      correct: 2,
      explanation: 'Pruning every 2-3 months helps maintain tree shape, remove dead wood, and improve air circulation.'
    },
    {
      question: 'What nutrient deficiency causes yellowing leaves in cacao plants?',
      options: [
        'Iron deficiency',
        'Nitrogen deficiency',
        'Calcium deficiency',
        'Phosphorus deficiency'
      ],
      correct: 1,
      explanation: 'Nitrogen deficiency typically causes yellowing of older leaves as nitrogen is mobile in plants.'
    }
  ];

  const [questions, setQuestions] = useState([]);

  // Randomize questions and options
  const randomizeQuestions = () => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const randomized = shuffled.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));
    setQuestions(randomized);
  };

  // Initialize questions
  useEffect(() => {
    randomizeQuestions();
  }, []);

  // Create sound effects
  useEffect(() => {
    const createBeepSound = (frequency, duration, volume) => {
      return {
        play: () => {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
          } catch (error) {
            console.log('Audio not supported');
          }
        },
        stop: () => {}
      };
    };
    
    // Create sound effect functions
    correctSoundRef.current = { play: createBeepSound(1000, 0.3, 0.8) };
    incorrectSoundRef.current = { play: createBeepSound(200, 0.4, 0.8) };
    clickSoundRef.current = { play: createBeepSound(800, 0.15, 0.7) };
    gameOverSoundRef.current = { play: createBeepSound(1200, 0.6, 0.9) };
    timeUpSoundRef.current = { play: createBeepSound(500, 0.5, 0.9) };
    
    // Cleanup
    return () => {
      if (backgroundMusicRef.current && backgroundMusicRef.current.stop) {
        backgroundMusicRef.current.stop();
      }
    };
  }, []);
  
  // Handle background music
  useEffect(() => {
    if (gameStarted && !gameOver) {
      if (backgroundMusicRef.current && backgroundMusicRef.current.play) {
        backgroundMusicRef.current.play();
      }
    } else {
      if (backgroundMusicRef.current && backgroundMusicRef.current.stop) {
        backgroundMusicRef.current.stop();
      }
    }
  }, [gameStarted, gameOver]);
  
  // Sound helper functions
  const playSound = (soundRef) => {
    if (soundRef.current && soundRef.current.play) {
      try {
        soundRef.current.play();
      } catch (error) {
        console.log('Sound error:', error);
      }
    }
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft]);

  // Save quiz score to backend
  const saveQuizScore = async () => {
    if (scoreSaved || savingScore) return;
    
    try {
      setSavingScore(true);
      console.log('🎮 Saving quiz score...');
      
      const quizId = quizScoreAPI.getQuizIdFromComponent('CareManagementGame');
      const percentageScore = Math.round((score / questions.length) * 100);
      const timeTaken = 60 - timeLeft; // Time taken in seconds
      
      await quizScoreAPI.saveScore(
        quizId,
        percentageScore,
        questions.length,
        score,
        timeTaken
      );
      
      setScoreSaved(true);
      console.log('✅ Quiz score saved successfully!');

      // Hide notification after 5 seconds
      setTimeout(() => {
        setScoreSaved(false);
      }, 5000);

    } catch (error) {
      console.error('❌ Error saving quiz score:', error);
    } finally {
      setSavingScore(false);
    }
  };

  // Save score when game ends
  useEffect(() => {
    if (gameOver && !scoreSaved && questions.length > 0) {
      saveQuizScore();
    }
  }, [gameOver, scoreSaved, questions.length]);

  const handleOptionSelect = (index) => {
    if (feedback.show || gameOver) return;
    
    playSound(clickSoundRef);
    setSelectedOption(index);
    const isCorrect = index === questions[currentQuestion].correct;
    setFeedback({
      show: true,
      isCorrect,
      message: isCorrect ? 'Correct! ' + questions[currentQuestion].explanation : 
        'Incorrect. ' + questions[currentQuestion].explanation
    });
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      playSound(correctSoundRef);
    } else {
      playSound(incorrectSoundRef);
    }
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption(null);
        setFeedback({ show: false, isCorrect: false });
      } else {
        setGameOver(true);
        if (!timeUp) {
          playSound(gameOverSoundRef);
        }
      }
    }, 2000);
  };

  const handleTimeUp = () => {
    setGameOver(true);
    setTimeUp(true);
    playSound(timeUpSoundRef);
  };

  const resetGame = () => {
    playSound(clickSoundRef);
    randomizeQuestions();
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setFeedback({ show: false, isCorrect: false });
    setTimeLeft(60);
    setGameOver(false);
    setTimeUp(false);
    setScoreSaved(false);
    setSavingScore(false);
  };

  const startGame = () => {
    playSound(clickSoundRef);
    randomizeQuestions();
    setGameStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setFeedback({ show: false, isCorrect: false });
    setTimeLeft(60);
    setGameOver(false);
    setTimeUp(false);
    setScoreSaved(false);
    setSavingScore(false);
  };

  const handleBackToMenu = () => {
    playSound(clickSoundRef);
    setGameStarted(false);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setFeedback({ show: false, isCorrect: false });
    setTimeLeft(60);
    setGameOver(false);
    setTimeUp(false);
    setScoreSaved(false);
    setSavingScore(false);
  };

  if (!gameStarted) {
    return (
      <div className="care-game-container">
        <div className="game-start-screen">
          <button className="back-button" onClick={() => navigate('/courses')}>
            <FaArrowLeft /> Back to Courses
          </button>
          
          <div className="game-content">
            <div className="game-icon">
              <FaLeaf />
            </div>
            <h1>Cacao Care Management Quiz</h1>
            <p>Test your knowledge about caring for cacao trees!</p>
            
            <div className="game-info">
              <div className="info-item">
                <FaInfoCircle />
                <span>5 questions about cacao care</span>
              </div>
              <div className="info-item">
                <FaClock />
                <span>60 seconds time limit</span>
              </div>
              <div className="info-item">
                <FaTint />
                <span>Learn about watering, pruning, and more</span>
              </div>
            </div>
            
            <button className="start-button" onClick={startGame}>
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const percentageScore = Math.round((score / questions.length) * 100);
    return (
      <div className="care-game-container">
        {scoreSaved && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            animation: 'slideInDown 0.5s ease-out',
            zIndex: 10000
          }}>
            <FaCheck style={{ fontSize: '20px' }} />
            Score Saved Successfully!
          </div>
        )}
        <CongratsPopup
          show={gameOver}
          title={timeUp ? "You Ran Out of Time!" : (percentageScore === 100 ? "Perfect Score!" : "Quiz Complete!")}
          message={timeUp ? "Time's up! Better luck next time." :
            (percentageScore === 100 ? "You're a cacao care expert! You answered all questions correctly!" :
            percentageScore >= 70 ? "Great job! You have good knowledge of cacao care management." :
              "Good effort! Keep practicing to improve your cacao care knowledge.")}
          score={score}
          totalQuestions={questions.length}
          percentage={percentageScore}
          timeTaken={60 - timeLeft}
          onRetry={resetGame}
          onBack={handleBackToMenu}
          scoreSaved={scoreSaved}
          savingScore={savingScore}
        />
      </div>
    );
  }

  // Game Screen
  return (
    <div className="care-game-container">
      <div className="game-header">
        <div className="score">Score: {score}</div>
        <div className="timer">Time: {timeLeft}s</div>
        <div className="question-count">
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </div>

      <div className="question-container">
        <h2>{questions[currentQuestion]?.question}</h2>

        <div className="options-container">
          {questions[currentQuestion]?.options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${selectedOption === index
                  ? feedback.isCorrect
                    ? 'correct'
                    : 'incorrect'
                  : ''
                }`}
              onClick={() => handleOptionSelect(index)}
              disabled={feedback.show}
            >
              {option}
              {selectedOption === index && (
                <span className="feedback-icon">
                  {feedback.isCorrect ? <FaCheck /> : <FaTimes />}
                </span>
              )}
            </button>
          ))}
        </div>

        {feedback.show && (
          <div className={`feedback ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
            <p>{feedback.message}</p>
          </div>
        )}
      </div>

      <div className="game-controls">
        <button className="reset-button" onClick={resetGame}>
          <FaRedo /> Reset
        </button>
        <button className="btn btn-outline" onClick={handleBackToMenu}>
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default CareManagementGame;
