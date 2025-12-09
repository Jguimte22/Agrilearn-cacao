import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRedo, FaCheck, FaTimes, FaThumbsUp, FaThumbsDown, FaPlay, FaStar } from 'react-icons/fa';
import './CacaoProcessingGame.css';
import CaremanageBg from '/CaremanageBg.png';
import quizScoreAPI from '../services/quizScoreAPI';

const CacaoProcessingGame = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false, message: '' });
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0, rotation: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [scoresSaved, setScoresSaved] = useState(false);
  const cardRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);

  // Audio refs
  const backgroundMusicRef = useRef(null);
  const correctSoundRef = useRef(null);
  const incorrectSoundRef = useRef(null);
  const swipeSoundRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    // Generate background music using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let musicInterval = null;

    const playNote = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create a pleasant melody pattern
      const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66]; // C major scale
      const randomNote = notes[Math.floor(Math.random() * notes.length)];

      oscillator.frequency.setValueAtTime(randomNote, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.25);
    };

    // Store the music player functions
    backgroundMusicRef.current = {
      play: () => {
        if (musicInterval) return;
        musicInterval = setInterval(playNote, 500); // Moderate tempo
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
        try {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
          // Silently fail if sound doesn't work
        }
      };
    };

    // Create sound effect functions
    correctSoundRef.current = { play: createBeepSound(800, 0.2, 0.6) }; // Pleasant success sound
    incorrectSoundRef.current = { play: createBeepSound(300, 0.3, 0.5) }; // Lower error sound
    swipeSoundRef.current = { play: createBeepSound(600, 0.1, 0.4) }; // Quick swipe sound

    // Cleanup
    return () => {
      if (backgroundMusicRef.current && backgroundMusicRef.current.stop) {
        backgroundMusicRef.current.stop();
      }
    };
  }, []);

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

  // Handle background music
  useEffect(() => {
    if (gameStarted) {
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
  }, [gameStarted]);

  // Quiz items about cacao harvesting practices
  const quizItems = [
    {
      type: 'image',
      content: 'Harvest cacao pods when they turn completely yellow',
      isCorrect: true,
      explanation: 'Fully yellow pods indicate optimal ripeness for harvesting.',
      category: 'Harvesting'
    },
    {
      type: 'text',
      content: 'Use machetes to knock pods off trees regardless of ripeness',
      isCorrect: false,
      explanation: 'Selective harvesting of ripe pods prevents damage to unripe ones and tree health.',
      category: 'Harvesting'
    },
    {
      type: 'image',
      content: 'Harvest during the dry season to reduce fungal issues',
      isCorrect: true,
      explanation: 'Dry season harvesting minimizes post-harvest diseases and fermentation problems.',
      category: 'Harvesting'
    },
    {
      type: 'text',
      content: 'Leave pods on the tree until they fall off naturally',
      isCorrect: false,
      explanation: 'Naturally fallen pods are often overripe or damaged, reducing quality.',
      category: 'Harvesting'
    },
    {
      type: 'image',
      content: 'Open pods immediately after harvesting to prevent fermentation',
      isCorrect: false,
      explanation: 'Pods should be opened within 24-48 hours, but immediate opening can lead to premature fermentation.',
      category: 'Processing'
    },
    {
      type: 'text',
      content: 'Separate beans from pods using clean tools to avoid contamination',
      isCorrect: true,
      explanation: 'Clean tools prevent bacterial contamination that affects bean quality.',
      category: 'Processing'
    },
    {
      type: 'image',
      content: 'Discard any moldy or diseased beans during processing',
      isCorrect: true,
      explanation: 'Removing defective beans prevents spread of mold and off-flavors.',
      category: 'Processing'
    },
    {
      type: 'text',
      content: 'Mix healthy and diseased beans together to save time',
      isCorrect: false,
      explanation: 'Mixing contaminated beans will spread mold and reduce overall quality.',
      category: 'Processing'
    },
    {
      type: 'image',
      content: 'Ferment beans for 5-7 days in wooden boxes',
      isCorrect: true,
      explanation: 'Proper fermentation duration develops chocolate flavor precursors.',
      category: 'Fermentation'
    },
    {
      type: 'text',
      content: 'Skip fermentation to speed up processing',
      isCorrect: false,
      explanation: 'Fermentation is essential for developing chocolate flavor and reducing bitterness.',
      category: 'Fermentation'
    },
    {
      type: 'image',
      content: 'Turn beans daily during fermentation for uniform processing',
      isCorrect: true,
      explanation: 'Regular turning ensures even fermentation and heat distribution.',
      category: 'Fermentation'
    },
    {
      type: 'text',
      content: 'Ferment beans in plastic bags to save space',
      isCorrect: false,
      explanation: 'Plastic bags trap moisture and heat, leading to poor fermentation and mold growth.',
      category: 'Fermentation'
    },
    {
      type: 'image',
      content: 'Dry beans on raised platforms to improve air circulation',
      isCorrect: true,
      explanation: 'Raised platforms allow better airflow and prevent ground moisture contamination.',
      category: 'Drying'
    },
    {
      type: 'text',
      content: 'Dry beans directly on concrete floors for faster drying',
      isCorrect: false,
      explanation: 'Concrete floors trap moisture and can cause uneven drying and mold issues.',
      category: 'Drying'
    },
    {
      type: 'image',
      content: 'Cover beans during rain to prevent moisture damage',
      isCorrect: true,
      explanation: 'Protecting beans from rain prevents re-wetting and mold growth.',
      category: 'Drying'
    },
    {
      type: 'text',
      content: 'Leave beans uncovered overnight to speed up drying',
      isCorrect: false,
      explanation: 'Night moisture can re-wet beans and promote fungal growth.',
      category: 'Drying'
    },
    {
      type: 'image',
      content: 'Sort beans by size and quality before storage',
      isCorrect: true,
      explanation: 'Sorting ensures uniform processing and higher quality final product.',
      category: 'Quality Control'
    },
    {
      type: 'text',
      content: 'Store all beans together regardless of quality',
      isCorrect: false,
      explanation: 'Mixing quality levels reduces overall value and can spread defects.',
      category: 'Quality Control'
    },
    {
      type: 'image',
      content: 'Store dried beans in breathable jute bags',
      isCorrect: true,
      explanation: 'Jute bags allow air circulation while protecting from contamination.',
      category: 'Storage'
    },
    {
      type: 'text',
      content: 'Store beans in airtight plastic containers',
      isCorrect: false,
      explanation: 'Airtight containers trap moisture and can lead to mold development.',
      category: 'Storage'
    }
  ];

  useEffect(() => {
    if (feedback.show) {
      const timer = setTimeout(() => {
        setFeedback({ show: false, isCorrect: false, message: '' });
      }, 1000); // Hide feedback after 1 second
      return () => clearTimeout(timer);
    }
  }, [feedback.show]);

  // Global mouse event listeners for better swipe handling
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isSwiping) {
        handleSwipeMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isSwiping) {
        handleSwipeEnd();
      }
    };

    if (isSwiping) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isSwiping]);

  // Set background image
  useEffect(() => {
    document.body.style.backgroundImage = `url(${CaremanageBg})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';

    return () => {
      // Cleanup background when component unmounts
      document.body.style.backgroundImage = '';
    };
  }, []);

  // Save quiz score when game completes
  useEffect(() => {
    if (showResult && !scoresSaved) {
      const saveScore = async () => {
        try {
          const percentageScore = Math.round((score / (quizItems.length * 10)) * 100);
          const correctAnswers = Math.round(score / 10); // Each correct answer is worth 10 points

          await quizScoreAPI.saveScore(
            'cacao-processing-quiz',
            percentageScore,
            quizItems.length,
            correctAnswers,
            0 // No time tracking in this game
          );

          console.log('✅ Cacao Processing quiz score saved successfully!');
          setScoresSaved(true);

          // Hide notification after 5 seconds
          setTimeout(() => {
            setScoresSaved(false);
          }, 5000);
        } catch (error) {
          console.error('❌ Error saving Cacao Processing quiz score:', error);
        }
      };
      saveScore();
    }
  }, [showResult, score, scoresSaved]);

  const resetCardPosition = () => {
    setCardPosition({ x: 0, y: 0, rotation: 0 });
    setSwipeDirection(null);
    setIsSwiping(false);
  };



  const handleSwipeStart = (e) => {
    if (feedback.show) return;
    setIsSwiping(true);
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    startX.current = clientX;
    startY.current = clientY;
  };

  const handleSwipeMove = (e) => {
    if (!isSwiping || feedback.show) return;

    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    const rotation = deltaX * 0.15; // Increased rotation for more visible effect

    setCardPosition({ x: deltaX, y: deltaY, rotation });
  };

  const handleSwipeEnd = () => {
    if (!isSwiping || feedback.show) return;
    setIsSwiping(false);

    const threshold = 100;
    let direction = null;

    if (Math.abs(cardPosition.x) > threshold) {
      direction = cardPosition.x > 0 ? 'right' : 'left';
      processSwipe(direction);
    } else {
      resetCardPosition();
    }
  };

  const processSwipe = (direction) => {
    const currentItem = quizItems[currentCardIndex];
    const userAnswer = direction === 'right';
    const isCorrect = userAnswer === currentItem.isCorrect;

    // Play swipe sound
    playSound(swipeSoundRef);

    setSwipeDirection(direction);
    setFeedback({
      show: true,
      isCorrect,
      message: currentItem.explanation
    });

    // Update score and combo
    if (isCorrect) {
      // Play correct answer sound
      playSound(correctSoundRef);

      const points = 10 + (combo >= 4 ? 5 : 0);
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);

      // Show confetti for perfect streaks
      if (combo === 4) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    } else {
      // Play incorrect answer sound
      playSound(incorrectSoundRef);

      setScore(prev => Math.max(0, prev - 5));
      setCombo(0);
    }

    // Animate card off screen and immediately move to next card
    if (direction === 'right') {
      setCardPosition({ x: 400, y: 0, rotation: 25 });
    } else {
      setCardPosition({ x: -400, y: 0, rotation: -25 });
    }

    // Move to next card after animation completes
    setTimeout(() => {
      if (currentCardIndex < quizItems.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        resetCardPosition();
      } else {
        setShowResult(true);
      }
    }, 500); // Wait for swipe animation to complete
  };

  const handleButtonClick = (isCorrect) => {
    if (feedback.show) return;
    processSwipe(isCorrect ? 'right' : 'left');
  };

  const resetGame = () => {
    setCurrentCardIndex(0);
    setScore(0);
    setShowResult(false);
    setCombo(0);
    setFeedback({ show: false, isCorrect: false, message: '' });
    resetCardPosition();
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const handleBackToLessons = () => {
    navigate('/courses/harvest-processing/lessons');
  };

  const handleBackToMenu = () => {
    setGameStarted(false);
    setCurrentCardIndex(0);
    setScore(0);
    setShowResult(false);
    setCombo(0);
    setFeedback({ show: false, isCorrect: false, message: '' });
    resetCardPosition();
  };

  // New game-specific button handlers
  const handleGameReset = () => {
    setCurrentCardIndex(0);
    setScore(0);
    setShowResult(false);
    setCombo(0);
    setFeedback({ show: false, isCorrect: false, message: '' });
    resetCardPosition();
  };

  const handleReturnToMenu = () => {
    setGameStarted(false);
    setCurrentCardIndex(0);
    setScore(0);
    setShowResult(false);
    setCombo(0);
    setFeedback({ show: false, isCorrect: false, message: '' });
    resetCardPosition();
  };

  const getRating = () => {
    const percentage = (score / (quizItems.length * 10)) * 100;
    if (percentage >= 90) return 'Harvest Master';
    if (percentage >= 70) return 'Skilled';
    return 'Beginner';
  };

  if (!gameStarted) {
    return (
      <div className="landing-page">
        <div className="landing-content">
          <div className="game-logo">
            <i className="fas fa-leaf-heart"></i>
            <h1>🌱 Harvest or Not</h1>
            <p className="game-subtitle">Master the Art of Cacao Harvesting & Processing</p>
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
                  <h3>Read the Statement</h3>
                  <p>Each card shows a cacao harvesting or processing practice</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">2</div>
                <div className="step-info">
                  <h3>Swipe or Click</h3>
                  <p><span className="correct-demo">Right/Correct</span> for good practice | <span className="incorrect-demo">Left/Incorrect</span> for bad practice</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">3</div>
                <div className="step-info">
                  <h3>Build Your Streak</h3>
                  <p>+10 points per correct answer, +5 bonus for 5+ streak, -5 for wrong answer</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">4</div>
                <div className="step-info">
                  <h3>Complete All Cards</h3>
                  <p>Answer all {quizItems.length} questions to become a Harvest Master!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-buttons">
            <button className="btn-primary" onClick={startGame}>
              <FaPlay />
              Start Game
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

  if (showResult) {
    return (
      <div className="harvest-or-not-container">
        <div className="game-completed">
          <div className="completed-content">
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
                <FaStar style={{ fontSize: '20px', color: '#ffd700' }} />
                Score Saved Successfully!
              </div>
            )}
            <h2>Congratulations! </h2>
            <p>You've completed the Harvest Challenge!</p>

            <div className="game-stats">
              <div className="stat">
                <span className="stat-value">{score}</span>
                <span className="stat-label">Score</span>
              </div>
              <div className="stat">
                <span className="stat-value">{getRating()}</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat">
                <span className="stat-value">{Math.round((score / (quizItems.length * 10)) * 100)}%</span>
                <span className="stat-label">Accuracy</span>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="primary-button"
                onClick={resetGame}
              >
                Play Again
              </button>
              <button
                className="secondary-button"
                onClick={handleBackToLessons}
              >
                Back to Lessons
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only get current item if game is active and within bounds
  const currentItem = !showResult && currentCardIndex < quizItems.length ? quizItems[currentCardIndex] : null;

  return (
    <>
      <div className="harvest-or-not-container">
        {gameStarted && !showResult && (
          <>
            <div className="cacao-game-header-v2">
              <div className="header-section score-section">
                <div className="header-icon">
                  <FaStar />
                </div>
                <div className="header-content">
                  <span className="header-label">Score</span>
                  <span className="header-value">{score}</span>
                </div>
              </div>

              <div className="header-section combo-section">
                <div className="header-icon">
                  {combo >= 5 ? <FaThumbsUp /> : <FaCheck />}
                </div>
                <div className="header-content">
                  <span className="header-label">Combo</span>
                  <span className={`header-value ${combo >= 5 ? 'combo-streak' : ''}`}>
                    {combo >= 5 ? `🔥 ${combo}` : combo}
                  </span>
                </div>
              </div>

              <div className="header-section card-section">
                <div className="header-icon">
                  <FaCheck />
                </div>
                <div className="header-content">
                  <span className="header-label">Progress</span>
                  <span className="header-value">
                    {currentCardIndex + 1}/{quizItems.length}
                  </span>
                </div>
              </div>
            </div>

            {currentItem && (
              <div className="game-area">
                <div className="category-badge">{currentItem.category}</div>

                <div
                  className=""
                  ref={cardRef}
                  style={{
                    width: '280px',
                    height: '350px',
                    backgroundColor: 'white',
                    border: '2px solid #5A381E',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(90, 56, 30, 0.2)',
                    position: 'relative',
                    cursor: 'grab',
                    margin: '0 auto',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: 'none',
                    zIndex: 1,
                    transform: `translateX(${cardPosition.x}px) translateY(${cardPosition.y}px) rotate(${cardPosition.rotation}deg) ${isSwiping ? 'scale(1.02)' : 'scale(1)'}`,
                    transition: isSwiping ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseDown={handleSwipeStart}
                  onMouseMove={handleSwipeMove}
                  onMouseUp={handleSwipeEnd}
                  onMouseLeave={handleSwipeEnd}
                  onTouchStart={handleSwipeStart}
                  onTouchMove={handleSwipeMove}
                  onTouchEnd={handleSwipeEnd}
                >
                  <div className="card-content">
                    {currentItem.type === 'image' ? (
                      <div className="image-content">
                        <div className="image-placeholder">
                          🌱
                        </div>
                        <p>{currentItem.content}</p>
                      </div>
                    ) : (
                      <div className="text-content">
                        <p>{currentItem.content}</p>
                      </div>
                    )}
                  </div>
                </div>

                {isSwiping && (
                  <div className="swipe-indicators">
                    {cardPosition.x < -50 && (
                      <div className="indicator incorrect show">
                        <FaTimes /> Incorrect
                      </div>
                    )}
                    {cardPosition.x > 50 && (
                      <div className="indicator correct show">
                        <FaThumbsUp /> Correct
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Game Action Buttons */}
            <div className="game-action-buttons">
              <button className="game-reset-btn" onClick={handleGameReset}>
                <FaRedo /> Reset Game
              </button>
              <button className="game-menu-btn" onClick={handleReturnToMenu}>
                <FaArrowLeft /> Return to Menu
              </button>
            </div>

            {/* Visual Feedback Overlay */}
            {feedback.show && (
              <div className={`feedback-overlay ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                {feedback.isCorrect ? (
                  <>
                    <FaCheck />
                    <span>Correct!</span>
                  </>
                ) : (
                  <>
                    <FaTimes />
                    <span>Try Again</span>
                  </>
                )}
              </div>
            )}

          </>
        )}
      </div>
    </>
  );
};

export default CacaoProcessingGame;
