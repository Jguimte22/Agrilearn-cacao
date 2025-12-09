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
  const [scoresSaved, setScoresSaved] = useState(false);

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
      question: 'What is the recommended amount of shade for young cacao trees?',
      options: [
        '0-20%',
        '30-50%',
        '60-80%',
        '90-100%'
      ],
      correct: 1,
      explanation: 'Young cacao trees benefit from 30-50% shade to protect them from direct sunlight while allowing enough light for growth.'
    },
    {
      question: 'Which nutrient is most important for cacao pod development?',
      options: [
        'Nitrogen',
        'Phosphorus',
        'Potassium',
        'Calcium'
      ],
      correct: 2,
      explanation: 'Potassium is crucial for fruit development and quality in cacao plants.'
    },
    {
      question: 'How often should you prune cacao trees?',
      options: [
        'Never',
        'Once a month',
        '2-3 times per year',
        'Every 5 years'
      ],
      correct: 2,
      explanation: 'Regular pruning 2-3 times a year helps maintain tree shape, remove diseased branches, and improve air circulation.'
    },
    {
      question: 'What is the best time of day to inspect cacao trees for pests?',
      options: [
        'Early morning',
        'Midday',
        'Evening',
        'Night'
      ],
      correct: 0,
      explanation: 'Early morning is best for pest inspection as many pests are active and temperatures are cooler, making them easier to spot.'
    },
    {
      question: 'Which disease is caused by a fungus and affects cacao pods?',
      options: [
        'Black pod disease',
        'Cacao swollen shoot virus',
        'Witches broom',
        'Frosty pod rot'
      ],
      correct: 0,
      explanation: 'Black pod disease is caused by various Phytophthora fungal species and is one of the most serious diseases affecting cacao production.'
    },
    {
      question: 'What is the optimal pH range for cacao soil?',
      options: [
        '4.0-5.0',
        '6.0-7.0',
        '7.0-8.0',
        '8.0-9.0'
      ],
      correct: 1,
      explanation: 'Cacao grows best in slightly acidic soils with a pH range of 6.0-7.0 for optimal nutrient availability.'
    },
    {
      question: 'Which type of fertilizer is most beneficial during the flowering stage?',
      options: [
        'High nitrogen',
        'High phosphorus',
        'High potassium',
        'Balanced NPK'
      ],
      correct: 1,
      explanation: 'High phosphorus fertilizer during flowering promotes better flower development and fruit set in cacao trees.'
    },
    {
      question: 'What is the minimum distance recommended between cacao trees?',
      options: [
        '1-2 meters',
        '3-4 meters',
        '5-6 meters',
        '7-8 meters'
      ],
      correct: 1,
      explanation: 'A spacing of 3-4 meters between cacao trees allows adequate room for growth while maximizing land use efficiency.'
    }
  ];

  // State for randomized questions
  const [questions, setQuestions] = useState([]);

  // Function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to randomize questions and options
  const randomizeQuestions = () => {
    // Get 10 random questions (or all if less than 10)
    const shuffledQuestions = shuffleArray(allQuestions).slice(0, 10);

    // Randomize options for each question
    const randomizedQuestions = shuffledQuestions.map(question => {
      const optionsWithIndex = question.options.map((option, index) => ({
        text: option,
        isCorrect: index === question.correct
      }));

      const shuffledOptions = shuffleArray(optionsWithIndex);
      const newCorrectIndex = shuffledOptions.findIndex(option => option.isCorrect);

      return {
        ...question,
        options: shuffledOptions.map(option => option.text),
        correct: newCorrectIndex
      };
    });

    setQuestions(randomizedQuestions);
  };

  // Initialize questions on component mount
  useEffect(() => {
    randomizeQuestions();
  }, []);

  // Initialize audio
  useEffect(() => {
    // Generate background music using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let musicInterval = null;

    // Create a simple jolly melody
    const notes = [523.25, 659.25, 783.99, 1046.50, 880.00, 783.99, 659.25, 523.25, 659.25, 783.99, 880.00, 1046.50, 783.99, 659.25, 523.25]; // More intense, varied melody
    let noteIndex = 0;

    const playNote = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = notes[noteIndex];
      oscillator.type = 'triangle'; // More interesting waveform

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05); // Higher volume
      gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.25);

      noteIndex = (noteIndex + 1) % notes.length;
    };

    // Store the music player functions
    backgroundMusicRef.current = {
      play: () => {
        if (musicInterval) return;
        playNote(); // Play first note immediately
        musicInterval = setInterval(playNote, 250); // Faster tempo for more intensity
      },
      stop: () => {
        if (musicInterval) {
          clearInterval(musicInterval);
          musicInterval = null;
        }
      }
    };

    // Create sound effects using Web Audio API
    const createBeepSound = (frequency, duration, volume) => {
      return () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      };
    };

    // Create sound effect functions
    correctSoundRef.current = { play: createBeepSound(1000, 0.3, 0.8) }; // Higher pitch, longer, louder
    incorrectSoundRef.current = { play: createBeepSound(200, 0.4, 0.8) }; // Lower pitch, longer, louder
    clickSoundRef.current = { play: createBeepSound(800, 0.15, 0.7) }; // Higher pitch, slightly longer, louder
    gameOverSoundRef.current = { play: createBeepSound(1200, 0.6, 0.9) }; // Higher pitch, longer, louder
    timeUpSoundRef.current = { play: createBeepSound(500, 0.5, 0.9) }; // Higher pitch, longer, louder

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
      // Start the generated background music
      if (backgroundMusicRef.current && backgroundMusicRef.current.play) {
        backgroundMusicRef.current.play();
      }
    } else {
      // Stop the music when game ends
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
        // Silently fail if sound doesn't work
        console.log('Sound effect failed:', error);
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

  const handleOptionSelect = (index) => {
    if (feedback.show || gameOver) return;

    playSound(clickSoundRef);
    setSelectedOption(index);
    const isCorrect = index === questions[currentQuestion].correct;
    setFeedback({
      show: true,
      isCorrect,
      message: isCorrect ? 'Correct! ' + questions[currentQuestion].explanation : 'Incorrect. ' + questions[currentQuestion].explanation
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
    randomizeQuestions(); // Randomize questions and options
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setFeedback({ show: false, isCorrect: false });
    setTimeLeft(60);
    setGameOver(false);
    setTimeUp(false);
  };

  const startGame = () => {
    playSound(clickSoundRef);
    setGameStarted(true);
  };

  const handleBackToLessons = () => {
    playSound(clickSoundRef);
    navigate('/courses/care-management/lessons');
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
  };

  // Save quiz score when game completes
  useEffect(() => {
    if (gameOver && !scoresSaved) {
      const saveScore = async () => {
        try {
          const percentageScore = Math.round((score / questions.length) * 100);

          await quizScoreAPI.saveScore(
            'care-management-quiz',
            percentageScore,
            questions.length,
            score,
            60 - timeLeft // Calculate time taken
          );

          console.log('✅ Care Management quiz score saved successfully!');
          setScoresSaved(true);
        } catch (error) {
          console.error('❌ Error saving Care Management quiz score:', error);
        }
      };
      saveScore();
    }
  }, [gameOver, score, timeLeft, scoresSaved]);

  if (!gameStarted) {
    return (
      <div className="landing-page">
        <div className="landing-content">
          <div className="game-logo">
            <i className="fas fa-leaf-heart"></i>
            <h1>🌱 Cacao Care Master</h1>
            <p className="game-subtitle">Master the Art of Cacao Plant Care</p>
          </div>

          {/* How to Play Guide */}
          <div className="how-to-play-card">
            <div className="how-to-play-header">
              <i className="fas fa-lightbulb"></i>
              <h2>How to Play</h2>
            </div>

            <div className="play-steps">
              <div className="play-step">
                <div className="step-icon">1</div>
                <div className="step-info">
                  <h3>Read the Question</h3>
                  <p>Each question tests your knowledge of cacao plant care</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">2</div>
                <div className="step-info">
                  <h3>Select Your Answer</h3>
                  <p>Choose the correct answer from the multiple-choice options</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">3</div>
                <div className="step-info">
                  <h3>Beat the Clock</h3>
                  <p>You have 60 seconds to answer all {allQuestions.length} questions</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">4</div>
                <div className="step-info">
                  <h3>Master Cacao Care</h3>
                  <p>Learn about watering, pest control, pruning, and nutrition!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-buttons">
            <button className="btn-primary" onClick={startGame}>
              <FaInfoCircle />
              Start Challenge
            </button>
            <button className="btn-secondary" onClick={handleBackToLessons}>
              <FaArrowLeft />
              Back to Lessons
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <>
        <CongratsPopup
          show={gameOver}
          title={timeUp ? "You Ran Out of Time!" : (score === questions.length ? "Perfect Score!" : "Game Complete!")}
          message={timeUp ? "Time's up! Better luck next time." :
            (score === questions.length ? "You're a cacao care expert! You answered all questions correctly!" :
              score >= questions.length / 2 ? "Great job! You have good knowledge of cacao care management." :
                "Good effort! Keep practicing to improve your cacao care knowledge.")}
          stats={[
            { value: `${score}/${questions.length}`, label: "Score" },
            { value: `${Math.round((score / questions.length) * 100)}%`, label: "Accuracy" },
            { value: timeUp ? "Time Up" : (score === questions.length ? "Expert" : score >= questions.length / 2 ? "Good" : "Learning"), label: "Status" }
          ]}
          onPlayAgain={resetGame}
          onBackToMenu={handleBackToMenu}
          playAgainText="Play Again"
          backToMenuText="Back to Menu"
        />
      </>
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
        <h2>{questions[currentQuestion].question}</h2>

        <div className="options-container">
          {questions[currentQuestion].options.map((option, index) => (
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
