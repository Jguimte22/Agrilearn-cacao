// src/PestDiseaseGame.jsx - Enhanced with Brown & Yellow Theme
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './PestDiseaseGame.css';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import quizScoreAPI from '../services/quizScoreAPI';

const PestDiseaseGame = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [time, setTime] = useState(0);
  const [currentImage, setCurrentImage] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [gameStats, setGameStats] = useState({
    correctAnswers: 0,
    totalQuestions: 0,
    timeSpent: 0
  });
  const [scoresSaved, setScoresSaved] = useState(false);

  // Audio refs
  const backgroundMusicRef = useRef(null);
  const clickSoundRef = useRef(null);
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const completionSoundRef = useRef(null);
  const musicContextRef = useRef(null);
  const musicNodesRef = useRef({ oscillators: [], gains: [] });

  // Initialize audio
  useEffect(() => {
    // Test audio support
    const testAudio = new Audio();
    console.log('Audio support:', testAudio.canPlayType('audio/mpeg'));

    // Create audio elements with absolute URLs
    backgroundMusicRef.current = new Audio(window.location.origin + '/background-music.mp3');
    clickSoundRef.current = new Audio(window.location.origin + '/click-sound.mp3');
    correctSoundRef.current = new Audio(window.location.origin + '/correct-sound.mp3');
    wrongSoundRef.current = new Audio(window.location.origin + '/wrong-sound.mp3');
    completionSoundRef.current = new Audio(window.location.origin + '/completion-sound.mp3');

    console.log('Audio elements created:', {
      bg: !!backgroundMusicRef.current,
      click: !!clickSoundRef.current,
      correct: !!correctSoundRef.current,
      wrong: !!wrongSoundRef.current,
      completion: !!completionSoundRef.current
    });

    // Configure background music
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.loop = true;
      backgroundMusicRef.current.volume = 0.3;
      backgroundMusicRef.current.muted = false;
      // Preload the audio
      backgroundMusicRef.current.load();
    }

    // Configure sound effects
    [clickSoundRef, correctSoundRef, wrongSoundRef, completionSoundRef].forEach(ref => {
      if (ref.current) {
        ref.current.volume = 0.5;
        ref.current.muted = false;
        ref.current.load(); // Preload audio files
      }
    });

    // Cleanup
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
    };
  }, []);

  // Sound functions
  let musicStarted = false; // Flag to track if music has been started

  // Create a simple beep sound as fallback
  const playBeep = (frequency = 440, duration = 100) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('Beep sound failed:', error);
    }
  };

  const playClickSound = () => {
    // Simple beep that always works
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch (error) {
      console.log('Click sound failed:', error);
    }
  };

  const playClickSoundWithMusic = () => {
    playClickSound();

    // Start background music immediately after Start button click
    console.log('Start button clicked, gameStarted:', gameStarted, 'musicStarted:', musicStarted);

    if (!musicStarted) {
      musicStarted = true;
      console.log('Starting background music...');
      setTimeout(() => {
        startSimpleBackgroundMusic();
      }, 100); // Small delay to ensure game state is updated
    }
  };

  const playCorrectSound = () => {
    playBeep(600, 200); // Pleasant tone for correct
    if (correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0;
      correctSoundRef.current.play().catch(e => console.log('Correct sound play failed:', e));
    }
  };

  const playWrongSound = () => {
    playBeep(300, 200); // Lower tone for wrong
    if (wrongSoundRef.current) {
      wrongSoundRef.current.currentTime = 0;
      wrongSoundRef.current.play().catch(e => console.log('Wrong sound play failed:', e));
    }
  };

  const playCompletionSound = () => {
    // Play a victory fanfare with beeps
    playBeep(523, 150); // C note
    setTimeout(() => playBeep(659, 150), 200); // E note
    setTimeout(() => playBeep(784, 300), 400); // G note

    if (completionSoundRef.current) {
      completionSoundRef.current.currentTime = 0;
      completionSoundRef.current.play().catch(e => console.log('Completion sound play failed:', e));
    }
  };

  // Simple background music that definitely works
  const startSimpleBackgroundMusic = () => {
    try {
      console.log('🎵 Starting simple background music...');
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const playNote = (frequency, startTime, duration) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.value = frequency;
        osc.type = 'square'; // Changed to square for more retro game sound

        gain.gain.setValueAtTime(0.2, startTime); // Increased volume
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // More upbeat and jolly melody
      const melody = [
        523, 659, 784, 659,  // C, E, G, E
        523, 440, 523, 587,  // C, A, C, D
        659, 784, 880, 784,  // E, G, A, G
        659, 523, 587, 523   // E, C, D, C
      ];

      const playMelody = (startTime = audioContext.currentTime) => {
        console.log('🎵 Playing melody...');
        melody.forEach((note, index) => {
          playNote(note, startTime + index * 0.2, 0.15);
        });
      };

      // Play immediately and then every 2.5 seconds
      playMelody();
      const interval = setInterval(() => {
        if (audioContext.state === 'closed') {
          clearInterval(interval);
          return;
        }
        playMelody();
      }, 2500);

      // Store for cleanup
      musicContextRef.current = {
        close: () => {
          clearInterval(interval);
          audioContext.close();
        }
      };

      console.log('✅ Simple background music started successfully');

    } catch (error) {
      console.log('❌ Simple background music failed:', error);
    }
  };

  const stopBackgroundMusic = () => {
    // Stop external music
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }

    // Stop generated music
    if (musicContextRef.current) {
      musicContextRef.current.close();
      musicContextRef.current = null;
    }
  };

  // Enhanced game data - pest/disease questions
  const questions = [
    {
      id: 1,
      question: "What is the primary symptom of Black Pod Disease in cacao?",
      image: "/pods.png",
      answers: [
        { id: 1, text: "White powdery spots on leaves", correct: false },
        { id: 2, text: "Dark, sunken lesions on pods", correct: true },
        { id: 3, text: "Yellowing of young leaves", correct: false },
        { id: 4, text: "Web-like growth on branches", correct: false }
      ],
      difficulty: "easy"
    },
    {
      id: 2,
      question: "Which pest is known for boring into cacao stems and branches?",
      image: "/aphids.png",
      answers: [
        { id: 1, text: "Cacao Pod Borer", correct: true },
        { id: 2, text: "Leaf-cutting Ants", correct: false },
        { id: 3, text: "Aphids", correct: false },
        { id: 4, text: "Mealybugs", correct: false }
      ],
      difficulty: "medium"
    },
    {
      id: 3,
      question: "What causes Witches' Broom disease in cacao plants?",
      image: "/fungus.png",
      answers: [
        { id: 1, text: "Bacteria", correct: false },
        { id: 2, text: "Virus", correct: false },
        { id: 3, text: "Fungus", correct: true },
        { id: 4, text: "Nematodes", correct: false }
      ],
      difficulty: "medium"
    },
    {
      id: 4,
      question: "Which is the best preventive measure for Black Pod Disease?",
      image: "/pods2.png",
      answers: [
        { id: 1, text: "Regular pruning and proper drainage", correct: true },
        { id: 2, text: "Increasing fertilizer application", correct: false },
        { id: 3, text: "Reducing water supply", correct: false },
        { id: 4, text: "Planting closer together", correct: false }
      ],
      difficulty: "hard"
    },
    {
      id: 5,
      question: "What is the main symptom of Frosty Pod Rot?",
      image: "/white.png",
      answers: [
        { id: 1, text: "Brown spots on leaves", correct: false },
        { id: 2, text: "White, powdery fungal growth on pods", correct: true },
        { id: 3, text: "Yellowing of branches", correct: false },
        { id: 4, text: "Root decay", correct: false }
      ],
      difficulty: "easy"
    },
    {
      id: 6,
      question: "Which insect transmits the Cacao Swollen Shoot Virus?",
      image: "/white2.png",
      answers: [
        { id: 1, text: "Beetles", correct: false },
        { id: 2, text: "Mealybugs", correct: true },
        { id: 3, text: "Caterpillars", correct: false },
        { id: 4, text: "Grasshoppers", correct: false }
      ],
      difficulty: "hard"
    },
    {
      id: 7,
      question: "What is the recommended treatment for Mirids (Capsids)?",
      image: "/virus.png",
      answers: [
        { id: 1, text: "Remove infected plants immediately", correct: false },
        { id: 2, text: "Apply appropriate insecticides and maintain shade", correct: true },
        { id: 3, text: "Increase watering frequency", correct: false },
        { id: 4, text: "Stop all fertilization", correct: false }
      ],
      difficulty: "medium"
    },
    {
      id: 8,
      question: "Which disease causes abnormal shoot proliferation in cacao?",
      image: "/peste.png",
      answers: [
        { id: 1, text: "Black Pod Disease", correct: false },
        { id: 2, text: "Witches' Broom", correct: true },
        { id: 3, text: "Frosty Pod Rot", correct: false },
        { id: 4, text: "Mealybugs", correct: false }
      ],
      difficulty: "medium"
    }
  ];

  // Timer effect   
  useEffect(() => {
    let timer;
    if (gameStarted && !showCompletion) {
      timer = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStarted, showCompletion]);

  // Shuffle array function
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Randomize questions and answers
  const randomizeQuestions = (questionsArray) => {
    return questionsArray.map(question => ({
      ...question,
      answers: shuffleArray(question.answers)
    }));
  };

  // State for randomized questions
  const [randomizedQuestions, setRandomizedQuestions] = useState([]);

  // Initialize game
  useEffect(() => {
    if (gameStarted) {
      // Randomize questions and answers when game starts
      const shuffledQuestions = shuffleArray(questions);
      const randomized = randomizeQuestions(shuffledQuestions);
      setRandomizedQuestions(randomized);

      setCurrentImage(randomized[0].image);
      setGameStats(prev => ({
        ...prev,
        totalQuestions: questions.length
      }));
      // Note: Background music will start after first user interaction (click)
    } else {
      stopBackgroundMusic(); // Stop music when returning to landing page
      musicStarted = false; // Reset music flag
    }
  }, [gameStarted]);

  const handleAnswer = (answer) => {
    if (showFeedback) return;

    playClickSound(); // Play click sound when selecting answer
    setShowFeedback(true);
    setSelectedAnswer(answer.id);

    if (answer.correct) {
      const points = Math.round(100 / questions.length); // Divide 100 by number of questions
      setScore(prevScore => prevScore + points);
      setGameStats(prev => ({
        ...prev,
        correctAnswers: prev.correctAnswers + 1
      }));
      playCorrectSound(); // Play correct sound
    } else {
      playWrongSound(); // Play wrong sound
    }

    // Move to next question or complete game
    setTimeout(() => {
      if (currentQuestion < randomizedQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setShowFeedback(false);
        setSelectedAnswer(null);
        setCurrentImage(randomizedQuestions[currentQuestion + 1].image);
      } else {
        setGameStats(prev => ({
          ...prev,
          timeSpent: time
        }));
        setShowCompletion(true);
        playCompletionSound(); // Play completion sound
        stopBackgroundMusic(); // Stop background music when game completes
      }
    }, 1500);
  };

  const resetGame = () => {
    // Don't play click sound for reset to avoid duplicate

    // Randomize questions and answers again for reset
    const shuffledQuestions = shuffleArray(questions);
    const randomized = randomizeQuestions(shuffledQuestions);
    setRandomizedQuestions(randomized);

    setCurrentQuestion(0);
    setScore(0);
    setShowFeedback(false);
    setSelectedAnswer(null);
    setTime(0);
    setShowCompletion(false);
    setGameStats({
      correctAnswers: 0,
      totalQuestions: questions.length,
      timeSpent: 0
    });
    setCurrentImage(randomized[0].image);
    // Keep background music playing, don't restart it
  };

  const goToMenu = () => {
    playClickSound(); // Play click sound
    setGameStarted(false);
    // Music will stop automatically due to gameStarted change
  };

  const goToLessons = () => {
    playClickSound();
    navigate('/courses/pest-disease/lessons');
  };

  // Save quiz score when game completes
  useEffect(() => {
    if (showCompletion && !scoresSaved) {
      const saveScore = async () => {
        try {
          const percentageScore = Math.round((gameStats.correctAnswers / questions.length) * 100);

          await quizScoreAPI.saveScore(
            'pest-disease-quiz',
            percentageScore,
            questions.length,
            gameStats.correctAnswers,
            time
          );

          console.log('✅ Pest & Disease quiz score saved successfully!');
          setScoresSaved(true);

          // Hide notification after 5 seconds
          setTimeout(() => {
            setScoresSaved(false);
          }, 5000);
        } catch (error) {
          console.error('❌ Error saving Pest & Disease quiz score:', error);
        }
      };
      saveScore();
    }
  }, [showCompletion, gameStats.correctAnswers, time, scoresSaved]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Landing Page
  if (!gameStarted) {
    return (
      <div className="landing-page">
        <div className="landing-content">
          <div className="game-logo">
            <i className="fas fa-leaf-heart"></i>
            <h1>🐛 Pest & Disease Identification</h1>
            <p className="game-subtitle">Master the Art of Cacao Plant Protection</p>
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
                  <p>Each question tests your knowledge of cacao pests and diseases</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">2</div>
                <div className="step-info">
                  <h3>Select Your Answer</h3>
                  <p>Choose from multiple options based on visual clues and descriptions</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">3</div>
                <div className="step-info">
                  <h3>Learn & Earn Points</h3>
                  <p>Get instant feedback and earn points for correct answers</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">4</div>
                <div className="step-info">
                  <h3>Complete All Questions</h3>
                  <p>Answer all {questions.length} questions to master pest & disease identification!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-buttons">
            <button className="btn-primary" onClick={() => {
              playClickSoundWithMusic();
              setGameStarted(true);
            }}>
              <EmojiEventsIcon />
              Start Game
            </button>
            <button className="btn-secondary" onClick={goToLessons}>
              <ArrowBackIcon />
              Back to Lessons
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = randomizedQuestions[currentQuestion] || questions[0];

  // Prevent rendering if no current question
  if (!currentQ) {
    return <div>Loading...</div>;
  }

  return (
    <div className="game-wrapper">
      <div className="game-layout">
        {/* Left Panel - Stats & Controls */}
        <div className="left-panel">
          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <span className="stat-value">{formatTime(time)}</span>
                <span className="stat-label">Time Elapsed</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">
                <EmojiEventsIcon fontSize="inherit" />
              </div>
              <div className="stat-content">
                <span className="stat-value">{score}</span>
                <span className="stat-label">Current Score</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">
                <MenuBookIcon fontSize="inherit" />
              </div>
              <div className="stat-content">
                <span className="stat-value">{currentQuestion + 1}/{questions.length}</span>
                <span className="stat-label">Question</span>
              </div>
            </div>
          </div>

          <div className="controls-container">
            <button className="control-btn reset-btn" onClick={resetGame}>
              <RefreshIcon /> Reset Game
            </button>
            <button className="control-btn menu-btn" onClick={goToMenu}>
              <HomeIcon /> Main Menu
            </button>
          </div>
        </div>

        {/* Right Panel - Question Content */}
        <div className="right-panel">
          <div className="question-container">
            <div className="question-header">
              <h2 className="question-text">{currentQ.question}</h2>
              <div className="difficulty-badge">{currentQ.difficulty}</div>
            </div>

            {currentImage && (
              <div className="question-image">
                <img
                  src={currentImage}
                  alt="Cacao Pest or Disease"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/PestDiseaseBg.png';
                  }}
                  className={showFeedback ? 'show-feedback' : ''}
                />
              </div>
            )}

            <div className="answers-grid">
              {currentQ.answers.map((answer, index) => (
                <div
                  key={answer.id}
                  className={`answer-card ${selectedAnswer === answer.id
                      ? answer.correct ? 'correct' : 'incorrect'
                      : ''
                    } ${showFeedback ? 'disabled' : ''}`}
                  onClick={() => !showFeedback && handleAnswer(answer)}
                >
                  <div className="answer-number">{String.fromCharCode(65 + index)}</div>
                  <span className="answer-text">{answer.text}</span>
                  {showFeedback && answer.correct && (
                    <span className="feedback-icon">✓</span>
                  )}
                  {showFeedback && selectedAnswer === answer.id && !answer.correct && (
                    <span className="feedback-icon wrong">✗</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Popup */}
      {showCompletion && (
        <div className="completion-popup show">
          <div className="completion-content">
            {scoresSaved && (
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                animation: 'slideInDown 0.5s ease-out'
              }}>
                <EmojiEventsIcon style={{ fontSize: '20px' }} />
                Score Saved Successfully!
              </div>
            )}
            <EmojiEventsIcon className="completion-icon" />
            <h2 className="completion-title">Congratulations!</h2>
            <p>You've completed the Pest & Disease Quiz!</p>

            <div className="completion-stats">
              <div className="stat-item">
                <div className="stat-value">{gameStats.correctAnswers}/{questions.length}</div>
                <div className="stat-label">Correct</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{score}</div>
                <div className="stat-label">Score</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{formatTime(time)}</div>
                <div className="stat-label">Time</div>
              </div>
            </div>

            <div className="completion-actions">
              <button className="btn btn-primary" onClick={resetGame}>
                <RefreshIcon /> Play Again
              </button>
              <button className="btn btn-outline" onClick={goToLessons}>
                <HomeIcon /> Back to Lessons
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PestDiseaseGame;
