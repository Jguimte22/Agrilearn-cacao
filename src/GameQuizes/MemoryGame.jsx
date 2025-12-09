import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRedo, FaStar, FaClock, FaFire } from 'react-icons/fa';
import quizScoreAPI from '../services/quizScoreAPI';
import './MemoryGame.css';

// Card data with placeholder images
const cardImages = [
  { id: 1, src: '/CacaoTreePlant.png', name: 'Cacao Tree Plant' },
  { id: 2, src: '/CacaoSack.png', name: 'Cacao Sack' },
  { id: 3, src: '/CacaoPack.png', name: 'Cacao Pack' },
  { id: 4, src: '/CacaoCard.png', name: 'Cacao Card' },
  { id: 5, src: '/CacaoChocolate.png', name: 'Cacao Choco' },
  { id: 6, src: '/CacaoBean.png', name: 'Cacao Bean' },
];

// Background music using Web Audio API
let audioContext = null;
let isMusicPlaying = false;
let musicTimeoutId = null;

const playBackgroundMusic = () => {
  try {
    // Prevent multiple instances - check if music is already playing
    if (isMusicPlaying && audioContext && audioContext.state === 'running') {
      return;
    }

    // Stop any existing music before starting new
    if (audioContext) {
      try {
        audioContext.close();
      } catch (error) {
        console.log('Error closing existing audio context:', error);
      }
    }

    // Clear any existing timeout
    if (musicTimeoutId) {
      clearTimeout(musicTimeoutId);
      musicTimeoutId = null;
    }

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    isMusicPlaying = true;

    const tempo = 120;
    const beatDuration = 60 / tempo;

    // Jolly melody notes (C Major scale with happy rhythm)
    const melody = [
      { note: 523.25, duration: beatDuration * 0.25, volume: 0.08 }, // C5
      { note: 523.25, duration: beatDuration * 0.25, volume: 0.08 }, // C5
      { note: 587.33, duration: beatDuration * 0.25, volume: 0.08 }, // D5
      { note: 659.25, duration: beatDuration * 0.25, volume: 0.08 }, // E5
      { note: 659.25, duration: beatDuration * 0.25, volume: 0.08 }, // E5
      { note: 587.33, duration: beatDuration * 0.25, volume: 0.08 }, // D5
      { note: 523.25, duration: beatDuration * 0.5, volume: 0.08 },  // C5
      { note: 392.00, duration: beatDuration * 0.5, volume: 0.08 },  // G4
      { note: 523.25, duration: beatDuration * 0.25, volume: 0.08 }, // C5
      { note: 523.25, duration: beatDuration * 0.25, volume: 0.08 }, // C5
      { note: 587.33, duration: beatDuration * 0.25, volume: 0.08 }, // D5
      { note: 659.25, duration: beatDuration * 0.25, volume: 0.08 }, // E5
      { note: 659.25, duration: beatDuration * 0.25, volume: 0.08 }, // E5
      { note: 587.33, duration: beatDuration * 0.25, volume: 0.08 }, // D5
      { note: 523.25, duration: beatDuration * 0.5, volume: 0.08 },  // C5
      { note: 392.00, duration: beatDuration * 0.5, volume: 0.08 },  // G4
    ];

    // Bass line for fuller sound
    const bassLine = [
      { note: 261.63, duration: beatDuration * 1, volume: 0.04 }, // C4
      { note: 392.00, duration: beatDuration * 1, volume: 0.04 }, // G4
      { note: 261.63, duration: beatDuration * 1, volume: 0.04 }, // C4
      { note: 392.00, duration: beatDuration * 1, volume: 0.04 }, // G4
    ];

    // Calculate total duration of the music
    const totalMelodyDuration = melody.reduce((sum, note) => sum + note.duration, 0);
    const totalBassDuration = bassLine.reduce((sum, note) => sum + note.duration, 0);
    const totalDuration = Math.max(totalMelodyDuration, totalBassDuration);

    // Create a looping music track
    const loopMusic = () => {
      // Check if music should continue playing
      if (!isMusicPlaying || !audioContext || audioContext.state === 'closed') {
        return;
      }

      let currentTime = audioContext.currentTime;

      // Play melody
      melody.forEach((note, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = note.note;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(note.volume, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

        oscillator.start(currentTime);
        oscillator.stop(currentTime + note.duration);

        currentTime += note.duration;
      });

      // Play bass line
      const bassStartTime = audioContext.currentTime;
      bassLine.forEach((note, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = note.note;
        oscillator.type = 'triangle';

        const noteStartTime = bassStartTime + (index * beatDuration * 1);

        gainNode.gain.setValueAtTime(0, noteStartTime);
        gainNode.gain.linearRampToValueAtTime(note.volume, noteStartTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, noteStartTime + note.duration);

        oscillator.start(noteStartTime);
        oscillator.stop(noteStartTime + note.duration);
      });

      // Schedule the next loop
      musicTimeoutId = setTimeout(() => {
        if (isMusicPlaying && audioContext && audioContext.state === 'running') {
          loopMusic();
        }
      }, totalDuration * 1000);
    };

    // Start the loop
    loopMusic();

  } catch (error) {
    console.log('Audio playback not supported');
    isMusicPlaying = false;
  }
};

// Stop background music
const stopBackgroundMusic = () => {
  isMusicPlaying = false;

  // Clear any pending timeout
  if (musicTimeoutId) {
    clearTimeout(musicTimeoutId);
    musicTimeoutId = null;
  }

  // Close audio context
  if (audioContext) {
    try {
      audioContext.close();
      audioContext = null;
    } catch (error) {
      console.log('Error stopping music:', error);
    }
  }
};

// Enjoyable sound effects using Web Audio API
const playSound = (type) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const createNote = (frequency, startTime, duration, volume = 0.1) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);

      return oscillator;
    };

    const now = audioContext.currentTime;

    switch (type) {
      case 'flip':
        // Pleasant flip sound - gentle ascending chime
        createNote(523.25, now, 0.1, 0.08); // C5
        createNote(659.25, now + 0.05, 0.1, 0.06); // E5
        createNote(783.99, now + 0.1, 0.15, 0.04); // G5
        break;

      case 'match':
        // Happy match sound - major chord arpeggio
        createNote(523.25, now, 0.15, 0.12); // C5
        createNote(659.25, now + 0.1, 0.15, 0.10); // E5
        createNote(783.99, now + 0.2, 0.15, 0.08); // G5
        createNote(1046.50, now + 0.3, 0.2, 0.06); // C6 (higher octave)
        break;

      case 'win':
        // Victory fanfare - ascending major scale
        const winNotes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]; // C5 to C6 scale
        winNotes.forEach((freq, index) => {
          createNote(freq, now + index * 0.1, 0.2, 0.1);
        });
        // Final chord
        createNote(523.25, now + 0.8, 0.3, 0.08); // C5
        createNote(659.25, now + 0.8, 0.3, 0.06); // E5
        createNote(783.99, now + 0.8, 0.3, 0.06); // G5
        break;

      case 'error':
        // Gentle error sound - soft descending tone
        createNote(440.00, now, 0.1, 0.06); // A4
        createNote(349.23, now + 0.08, 0.12, 0.04); // F4
        createNote(293.66, now + 0.15, 0.15, 0.02); // D4
        break;
    }
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};

const MemoryGame = () => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [scoreSaved, setScoreSaved] = useState(false);
  const navigate = useNavigate();

  // Initialize game
  useEffect(() => {
    console.log('cardImages length:', cardImages.length);

    // Create pairs of cards with unique IDs
    const pairs = [];
    cardImages.forEach((card, index) => {
      pairs.push({ ...card, id: `${card.name}-${index}-1` });
      pairs.push({ ...card, id: `${card.name}-${index}-2` });
    });

    console.log('pairs length:', pairs.length);

    // Shuffle the cards
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    console.log('shuffled length:', shuffled.length);
    setCards(shuffled);
  }, []);

  // Game timer
  useEffect(() => {
    let timer;
    if (gameStarted && !gameOver && solved.length < cards.length) {
      timer = setInterval(() => {
        setGameTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, solved.length, cards.length]);

  // Background music control
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Play music when game starts
      playBackgroundMusic();
    } else if (!gameStarted) {
      // Stop music when going back to landing page
      stopBackgroundMusic();
    }

    // Cleanup when component unmounts
    return () => {
      stopBackgroundMusic();
    };
  }, [gameStarted, gameOver]);

  // Save quiz score when game ends
  useEffect(() => {
    if (gameOver && gameStarted) {
      const saveScore = async () => {
        try {
          const totalCards = cards.length;
          // Calculate score based on moves and time (lower is better)
          const perfectMoves = totalCards / 2; // Perfect score if matches in minimum moves
          const movesPenalty = Math.max(0, moves - perfectMoves);
          const timePenalty = Math.floor(gameTime / 10); // Penalty for every 10 seconds
          const rawScore = 100 - (movesPenalty * 2) - timePenalty;
          const percentageScore = Math.max(0, Math.min(100, Math.round(rawScore)));

          await quizScoreAPI.saveScore(
            'memory-game-quiz', // quizId
            percentageScore, // score (0-100)
            totalCards / 2, // totalQuestions (number of pairs)
            totalCards / 2, // correctAnswers (all pairs matched)
            gameTime // timeTaken in seconds
          );

          console.log('✅ Memory Game score saved successfully!');
          setScoreSaved(true);

          // Hide notification after 5 seconds
          setTimeout(() => {
            setScoreSaved(false);
          }, 5000);
        } catch (error) {
          console.error('❌ Error saving Memory Game score:', error);
        }
      };

      saveScore();
    }
  }, [gameOver, gameStarted, moves, gameTime, cards.length]);

  // Handle card click
  const handleClick = (id) => {
    if (disabled || flipped.includes(id) || solved.includes(id)) return;

    // Play flip sound
    playSound('flip');

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    setMoves(prevMoves => prevMoves + 1);

    // If we have two cards flipped, check for a match
    if (newFlipped.length === 2) {
      setDisabled(true);

      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(card => card.id === firstId);
      const secondCard = cards.find(card => card.id === secondId);

      if (firstCard.name === secondCard.name) {
        // Match found
        playSound('match');
        setSolved([...solved, firstId, secondId]);
        setFlipped([]);

        // Check for win condition
        if (solved.length + 2 === cards.length) {
          playSound('win');
          setGameOver(true);
        }

        // Re-enable cards after match delay
        setTimeout(() => {
          setDisabled(false);
        }, 300);
      } else {
        // No match
        playSound('error');
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  // Check if all cards are matched
  const isGameComplete = solved.length === cards.length;

  // Reset game
  const resetGame = () => {
    // Create pairs of cards with unique IDs (same as initial setup)
    const pairs = [];
    cardImages.forEach((card, index) => {
      pairs.push({ ...card, id: `${card.name}-${index}-1` });
      pairs.push({ ...card, id: `${card.name}-${index}-2` });
    });

    // Shuffle the cards
    const shuffledCards = [...pairs].sort(() => Math.random() - 0.5);

    setCards(shuffledCards);
    setFlipped([]);
    setSolved([]);
    setDisabled(false);
    setGameStarted(true);
    setGameOver(false);
    setMoves(0);
    setGameTime(0);
  };

  // Show loading state if cards are not yet initialized
  if (cards.length === 0) {
    return (
      <div className="memory-game">
        <h1>Cacao Memory Match</h1>
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate accuracy
  const calculateAccuracy = () => {
    const matchesFound = solved.length / 2;
    const accuracy = (matchesFound / Math.max(1, Math.floor(moves / 2))) * 100;
    return Math.min(100, Math.round(accuracy));
  };

  // Show intro screen if game hasn't started
  if (!gameStarted) {
    return (
      <div className="game-intro">
        <div className="intro-card">
          <div className="intro-left">
            <h1 className="intro-title">Cacao Memory Match</h1>
            <p className="intro-subtitle">Test your memory with these cacao-themed cards</p>

            <div className="card-preview">
              <div className="preview-card"></div>
              <div className="preview-card match"></div>
            </div>

            <div className="action-buttons">
              <button className="primary-button" onClick={() => setGameStarted(true)}>
                Start Game
              </button>
              <button className="secondary-button" onClick={() => navigate('/courses/cacao-basics/lessons')}>
                Back to Lessons
              </button>
            </div>
          </div>

          <div className="intro-right">
            <div className="game-instructions">
              <h2>How to Play</h2>
              <div className="instruction-steps">
                <div className="instruction">
                  <div className="step-number">1</div>
                  <p>Flip over any two cards to see what they are</p>
                </div>
                <div className="instruction">
                  <div className="step-number">2</div>
                  <p>Find matching pairs with the same image</p>
                </div>
                <div className="instruction">
                  <div className="step-number">3</div>
                  <p>Complete all matches to win the game</p>
                </div>
              </div>
            </div>

            <div className="game-tip">
              <p>Tip: Pay attention to card positions to find matches faster!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-game">
      {gameOver ? (
        <div className="game-completed">
          <div className="completed-content">
            {scoreSaved && (
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
            <p>You've matched all the cards!</p>

            <div className="game-stats">
              <div className="stat">
                <span className="stat-value">{moves}</span>
                <span className="stat-label">Moves</span>
              </div>
              <div className="stat">
                <span className="stat-value">{formatTime(gameTime)}</span>
                <span className="stat-label">Time</span>
              </div>
              <div className="stat">
                <span className="stat-value">{calculateAccuracy()}%</span>
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
                onClick={() => navigate('/courses/cacao-basics/lessons')}
              >
                Back to Lessons
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Game Header with Stats */}
          <div className="game-header" style={{
            background: 'rgba(255, 255, 255, 1)',
            backdropFilter: 'blur(15px)',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
            width: '100%',
            maxWidth: '800px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setGameStarted(false)}
                style={{
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(107, 114, 128, 0.25)',
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(107, 114, 128, 0.35)';
                  e.target.style.background = 'linear-gradient(135deg, #5b6370 0%, #3b4553 100%)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.25)';
                  e.target.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
                }}
              >
                <FaArrowLeft style={{ fontSize: '1rem' }} />
                <span>Menu</span>
              </button>
              <button
                onClick={resetGame}
                style={{
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(220, 53, 69, 0.25)',
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.35)';
                  e.target.style.background = 'linear-gradient(135deg, #cc2535 0%, #b82333 100%)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.25)';
                  e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                }}
              >
                <FaRedo style={{ fontSize: '1rem' }} />
                <span>Reset</span>
              </button>
            </div>

            <div className="game-stats" style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <div className="stat" style={{
                background: 'rgba(255, 255, 255, 1)',
                padding: '0.75rem 1.25rem',
                borderRadius: '50px',
                fontSize: '0.95rem',
                fontWeight: '700',
                color: '#000000',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '2px solid #4caf50',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'inherit'
              }}>
                <FaStar style={{ color: '#ffa500', fontSize: '1rem' }} />
                <span>{moves}</span>
                <span style={{
                  fontSize: '0.65rem',
                  color: '#666',
                  marginLeft: '0.25rem',
                  fontWeight: '500'
                }}>Moves</span>
              </div>
              <div className="stat" style={{
                background: 'rgba(255, 255, 255, 1)',
                padding: '0.75rem 1.25rem',
                borderRadius: '50px',
                fontSize: '0.95rem',
                fontWeight: '700',
                color: '#000000',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '2px solid #4caf50',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'inherit'
              }}>
                <FaClock style={{ color: '#ff6b6b', fontSize: '1rem' }} />
                <span>{formatTime(gameTime)}</span>
                <span style={{
                  fontSize: '0.65rem',
                  color: '#666',
                  marginLeft: '0.25rem',
                  fontWeight: '500'
                }}>Time</span>
              </div>
              <div className="stat" style={{
                background: 'rgba(255, 255, 255, 1)',
                padding: '0.75rem 1.25rem',
                borderRadius: '50px',
                fontSize: '0.95rem',
                fontWeight: '700',
                color: '#000000',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '2px solid #4caf50',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'inherit'
              }}>
                <FaFire style={{ color: '#ff9500', fontSize: '1rem' }} />
                <span>{solved.length / 2}/{cards.length / 2}</span>
                <span style={{
                  fontSize: '0.65rem',
                  color: '#666',
                  marginLeft: '0.25rem',
                  fontWeight: '500'
                }}>Matched</span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="memory-cards-grid">
            {cards.map((card, index) => {
              const isFlipped = flipped.includes(card.id) || solved.includes(card.id);
              return (
                <div
                  key={`${card.id}-${index}`}
                  className={`card ${isFlipped ? 'flipped' : ''} ${solved.includes(card.id) ? 'matched' : ''}`}
                  onClick={() => !disabled && !isFlipped && handleClick(card.id)}
                >
                  <div className="card-inner">
                    <div className="card-front">
                      <img
                        src={card.src}
                        alt={card.name}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14" fill="%23666"%3EImage%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <div className="card-back">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.19 0 2.34-.21 3.41-.6.3-.11.49-.4.49-.72 0-.43-.35-.78-.78-.78-.17 0-.33.06-.46.11-.91.33-1.78.49-2.66.49-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7c0 .88-.16 1.75-.49 2.66-.05.13-.11.29-.11.46 0 .43.35.78.78.78.32 0 .61-.19.72-.49.39-1.07.6-2.22.6-3.41 0-5.52-4.48-10-10-10z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MemoryGame;