import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRedo, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import './CloningTypesGames.css';
import CongratsPopup from '../components/CongratsPopup';
import quizScoreAPI from '../services/quizScoreAPI';

const CloningTypesGame = () => {
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

  // Questions about types of cloning in cacao
  const allQuestions = [
    {
      question: 'Which type of cloning involves taking a small piece of plant tissue and growing it in a sterile environment?',
      options: [
        'Budding',
        'Grafting',
        'Tissue Culture',
        'Air Layering'
      ],
      correct: 2,
      explanation: 'Tissue culture, also known as micropropagation, is a technique used to grow new plants from small pieces of plant tissue in a controlled, sterile environment.'
    },
    {
      question: 'What is the main advantage of grafting in cacao propagation?',
      options: [
        'It produces genetically identical plants',
        'It combines the best traits of two different plants',
        'It requires no special equipment',
        'It works for all plant species'
      ],
      correct: 1,
      explanation: 'Grafting combines the rootstock of one plant with the scion of another, allowing growers to combine desirable traits.'
    },
    {
      question: 'Which cloning method is best for mass-producing disease-free cacao plants?',
      options: [
        'Budding',
        'Stem Cuttings',
        'Tissue Culture',
        'Air Layering'
      ],
      correct: 2,
      explanation: 'Tissue culture allows for the mass production of disease-free plants in a controlled sterile environment.'
    },
    {
      question: 'Air layering is a method where roots are encouraged to form on a stem while it is still attached to the parent plant. Which part of the stem is typically wounded to promote rooting?',
      options: [
        'Roots',
        'Leaves',
        'Stem',
        'Flowers'
      ],
      correct: 2,
      explanation: 'Air layering involves inducing roots to form on a stem while it is still attached to the parent plant.'
    },
    {
      question: 'What is the primary advantage of cloning cacao plants?',
      options: [
        'Increased genetic diversity',
        'Faster growth rate',
        'Preservation of desirable traits',
        'Reduced susceptibility to diseases'
      ],
      correct: 2,
      explanation: 'Cloning allows for the propagation of cacao plants with desirable traits (e.g., high yield, disease resistance) ensuring genetic uniformity in the offspring.'
    },
    {
      question: 'Which cloning method involves joining parts of two plants so they grow as one?',
      options: [
        'Cutting',
        'Layering',
        'Grafting',
        'Suckering'
      ],
      correct: 2,
      explanation: 'Grafting is a horticultural technique whereby tissues of plants are joined so as to continue their growth together as one plant.'
    },
    {
      question: 'In cacao tissue culture, what is the purpose of using agar in the growth medium?',
      options: [
        'To provide nutrients',
        'To solidify the medium',
        'To adjust pH levels',
        'To prevent contamination'
      ],
      correct: 1,
      explanation: 'Agar is used as a gelling agent to solidify the growth medium, providing support for the plant tissues.'
    },
    {
      question: 'Which type of grafting is commonly used for cacao and involves inserting a single bud under the bark?',
      options: [
        'Cleft grafting',
        'Budding',
        'Approach grafting',
        'Side grafting'
      ],
      correct: 1,
      explanation: 'Budding, specifically T-budding, is commonly used for cacao and involves inserting a single bud under the bark of the rootstock.'
    },
    {
      question: 'What is the ideal time of year for performing air layering on cacao trees?',
      options: [
        'During dry season',
        'During rainy season',
        'During winter',
        'During flowering'
      ],
      correct: 1,
      explanation: 'Air layering is best performed during the rainy season when the plant is actively growing and conditions are favorable for root development.'
    },
    {
      question: 'Which cloning method produces plants with their own root systems?',
      options: [
        'Grafting',
        'Budding',
        'Cuttings',
        'Tissue culture'
      ],
      correct: 2,
      explanation: 'Cuttings produce plants that develop their own root systems, unlike grafting and budding where the scion uses the rootstock\'s roots.'
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
    navigate('/courses/cloning-techniques/lessons');
  };

  const handleBackToMenu = () => {
    playSound(clickSoundRef);
    setGameStarted(false);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setFeedback({ show: false, isCorrect: false });
    setTimeLeft(30);
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
            'cloning-types-quiz',
            percentageScore,
            questions.length,
            score,
            60 - timeLeft // Calculate time taken
          );

          console.log('✅ Cloning Types quiz score saved successfully!');
          setScoresSaved(true);

          // Hide notification after 5 seconds
          setTimeout(() => {
            setScoresSaved(false);
          }, 5000);
        } catch (error) {
          console.error('❌ Error saving Cloning Types quiz score:', error);
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
            <h1>🌱 Cacao Cloning Master</h1>
            <p className="game-subtitle">Master the Art of Cacao Propagation</p>
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
                  <p>Each question tests your knowledge of cacao cloning techniques</p>
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
                  <h3>Master Cloning Methods</h3>
                  <p>Learn about tissue culture, grafting, cuttings, and air layering!</p>
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
      <div className="cloning-game-container">
        {scoresSaved && (
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
          title={timeUp ? "You Ran Out of Time!" : (score === questions.length ? "Perfect Score!" : "Game Complete!")}
          message={timeUp ? "Time's up! Better luck next time." :
            (score === questions.length ? "You're a cacao cloning expert! You answered all questions correctly!" :
              score >= questions.length / 2 ? "Great job! You have good knowledge of cacao cloning methods." :
                "Good effort! Keep practicing to improve your knowledge of cacao cloning.")}
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
      </div>
    );
  }

  return (
    <div className="cloning-game-container">
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
              className={`option-button ${
                selectedOption === index
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

export default CloningTypesGame;
