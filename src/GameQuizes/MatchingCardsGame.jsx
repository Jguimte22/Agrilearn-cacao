import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './MatchingCardsGame.css';
import quizScoreAPI from '../services/quizScoreAPI';

const MatchingCardsGame = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  // game state
  const [cards, setCards] = useState([]);
  const [connections, setConnections] = useState([]);
  const [svgPaths, setSvgPaths] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCard, setDragStartCard] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [correctConnections, setCorrectConnections] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [scoresSaved, setScoresSaved] = useState(false);
  const [lastConnectionResult, setLastConnectionResult] = useState(null); // 'correct', 'incorrect', null

  const gameBoardRef = useRef(null);
  const bgMusicRef = useRef(null);

  // game data
  const gameData = {
    'planting-techniques': [
      { id: 1, term: 'Direct Seeding', icon: '🌱', definition: 'Planting seeds directly in the field where they will grow' },
      { id: 2, term: 'Transplanting', icon: '🌿', definition: 'Moving seedlings from nursery to main field' },
      { id: 3, term: 'Spacing', icon: '📏', definition: 'Proper distance between plants for optimal growth' },
      { id: 4, term: 'Depth Control', icon: '⬇️', definition: 'Planting at the right depth for seed germination' },
      { id: 5, term: 'Row Planting', icon: '📋', definition: 'Organizing plants in straight rows for easy management' },
      { id: 6, term: 'Mixed Cropping', icon: '🌾', definition: 'Growing different crops together in the same area' },
      { id: 7, term: 'Terrace Planting', icon: '⛰️', definition: 'Planting on stepped slopes to prevent erosion' },
      { id: 8, term: 'Container Planting', icon: '🪴', definition: 'Growing plants in pots or containers' }
    ]
  };

  // initialize game
  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line
  }, [moduleId]);

  const initializeGame = () => {
    const currentGame = gameData[moduleId] || gameData['planting-techniques'];

    const terms = currentGame.map((item) => ({
      ...item,
      type: 'term',
      uniqueId: `term-${item.id}`
    }));
    const defs = currentGame.map((item) => ({
      ...item,
      type: 'definition',
      uniqueId: `definition-${item.id}`
    }));

    const shuffledDefs = [...defs].sort(() => Math.random() - 0.5);

    setCards([...terms, ...shuffledDefs]);
    setConnections([]);
    setSvgPaths([]);
    setSelectedCard(null);
    setDragStartCard(null);
    setIsDragging(false);
    setGameCompleted(false);
    setMoves(0);
    setCorrectConnections(0);
    setIncorrectAttempts(0);
    setLastConnectionResult(null);
  };

  const startGame = () => {
    playSound('click');
    initializeGame();
    setGameStarted(true);
  };

  const goBack = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.stop();
      bgMusicRef.current = null;
    }
    navigate('/courses/planting-techniques/lessons');
  };

  const resetGame = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.stop();
      bgMusicRef.current = null;
    }
    playSound('click');
    initializeGame();
  };

  // Sound effects
  const playSound = useCallback((soundType) => {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    switch (soundType) {
      case 'select':
        const selectOsc = audioContext.createOscillator();
        const selectGain = audioContext.createGain();
        selectOsc.connect(selectGain);
        selectGain.connect(audioContext.destination);
        selectOsc.frequency.setValueAtTime(523.25, audioContext.currentTime);
        selectOsc.frequency.exponentialRampToValueAtTime(659.25, audioContext.currentTime + 0.1);
        selectGain.gain.setValueAtTime(0.15, audioContext.currentTime);
        selectGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        selectOsc.start(audioContext.currentTime);
        selectOsc.stop(audioContext.currentTime + 0.2);
        break;

      case 'correct':
        const corOsc1 = audioContext.createOscillator();
        const corOsc2 = audioContext.createOscillator();
        const corGain = audioContext.createGain();
        corOsc1.connect(corGain);
        corOsc2.connect(corGain);
        corGain.connect(audioContext.destination);
        corOsc1.frequency.value = 523.25;
        corOsc2.frequency.value = 659.25;
        corGain.gain.setValueAtTime(0.2, audioContext.currentTime);
        corGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        corOsc1.start(audioContext.currentTime);
        corOsc2.start(audioContext.currentTime);
        corOsc1.stop(audioContext.currentTime + 0.4);
        corOsc2.stop(audioContext.currentTime + 0.4);
        break;

      case 'incorrect':
        const errOsc = audioContext.createOscillator();
        const errGain = audioContext.createGain();
        errOsc.connect(errGain);
        errGain.connect(audioContext.destination);
        errOsc.frequency.setValueAtTime(392, audioContext.currentTime);
        errOsc.frequency.exponentialRampToValueAtTime(293, audioContext.currentTime + 0.2);
        errGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        errGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        errOsc.start(audioContext.currentTime);
        errOsc.stop(audioContext.currentTime + 0.2);
        break;

      case 'complete':
        const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.50];
        notes.forEach((freq, i) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          const startTime = audioContext.currentTime + (i * 0.1);
          gain.gain.setValueAtTime(0.15, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
          osc.start(startTime);
          osc.stop(startTime + 0.3);
        });
        break;

      case 'click':
        const clickOsc = audioContext.createOscillator();
        const clickGain = audioContext.createGain();
        clickOsc.connect(clickGain);
        clickGain.connect(audioContext.destination);
        clickOsc.frequency.value = 800;
        clickGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        clickOsc.start(audioContext.currentTime);
        clickOsc.stop(audioContext.currentTime + 0.05);
        break;
      default:
        return;
    }
  }, [soundEnabled]);

  // Background music
  useEffect(() => {
    if (gameStarted && soundEnabled) {
      if (bgMusicRef.current) {
        bgMusicRef.current.stop();
        bgMusicRef.current = null;
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const musicGain = audioContext.createGain();
      musicGain.gain.value = 0.05;

      let isPlaying = true;
      let melodyTimeout;

      const playMelody = () => {
        if (!soundEnabled || !gameStarted || !isPlaying) return;

        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33];
        let noteIndex = 0;

        const playNote = () => {
          if (!soundEnabled || !gameStarted || !isPlaying) return;

          const osc = audioContext.createOscillator();
          const noteGain = audioContext.createGain();
          osc.connect(noteGain);
          noteGain.connect(musicGain);
          musicGain.connect(audioContext.destination);

          osc.frequency.value = notes[noteIndex];
          noteGain.gain.setValueAtTime(0, audioContext.currentTime);
          noteGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
          noteGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);

          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.4);

          noteIndex = (noteIndex + 1) % notes.length;
          melodyTimeout = setTimeout(playNote, 500);
        };

        playNote();
      };

      playMelody();
      bgMusicRef.current = {
        stop: () => {
          isPlaying = false;
          if (melodyTimeout) clearTimeout(melodyTimeout);
        }
      };
    }

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.stop();
        bgMusicRef.current = null;
      }
    };
  }, [gameStarted, soundEnabled]);

  useEffect(() => {
    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.stop();
        bgMusicRef.current = null;
      }
    };
  }, []);

  // Save quiz score
  useEffect(() => {
    if (showCongrats && moves >= 8 && !scoresSaved) {
      const saveScore = async () => {
        try {
          const percentageScore = Math.round((correctConnections / moves) * 100);
          const totalCards = 8;

          await quizScoreAPI.saveScore(
            'matching-cards-quiz',
            percentageScore,
            totalCards,
            correctConnections,
            0
          );

          setScoresSaved(true);
          setTimeout(() => setScoresSaved(false), 5000);
        } catch (error) {
          console.error('Error saving score:', error);
        }
      };
      saveScore();
    }
  }, [showCongrats, moves, correctConnections, scoresSaved]);

  const isCardConnected = (card) => {
    return connections.some(conn =>
      (conn.termId === card.uniqueId || conn.definitionId === card.uniqueId)
    );
  };

  const attemptConnection = (termCard, definitionCard) => {
    const isCorrect = termCard.id === definitionCard.id;

    setMoves(prev => {
      const newMoves = prev + 1;
      if (newMoves >= 8) {
        setShowCongrats(true);
        playSound('complete');
      }
      return newMoves;
    });

    // Show visual feedback
    setLastConnectionResult(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => setLastConnectionResult(null), 800);

    playSound(isCorrect ? 'correct' : 'incorrect');

    const newConnection = {
      id: Date.now(),
      termId: termCard.uniqueId,
      definitionId: definitionCard.uniqueId,
      isCorrect: isCorrect
    };

    setConnections(prev => [...prev, newConnection]);

    if (isCorrect) {
      setCorrectConnections(prev => prev + 1);
    } else {
      setIncorrectAttempts(prev => prev + 1);
    }

    setSelectedCard(null);
  };

  const handleCardClick = (card) => {
    if (isCardConnected(card)) return;

    playSound('select');

    if (!selectedCard) {
      setSelectedCard(card);
    } else {
      if (selectedCard.uniqueId === card.uniqueId) {
        setSelectedCard(null);
        return;
      }

      if (selectedCard.type === card.type) {
        setSelectedCard(card);
        return;
      }

      const termCard = selectedCard.type === 'term' ? selectedCard : card;
      const definitionCard = selectedCard.type === 'definition' ? selectedCard : card;
      attemptConnection(termCard, definitionCard);
    }
  };

  const handleCardDragStart = (card, e) => {
    if (card.type !== 'term' || isCardConnected(card)) return;
    setIsDragging(true);
    setDragStartCard(card);
    setSelectedCard(card);
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', card.uniqueId);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleCardDragEnd = () => {
    setIsDragging(false);
    setDragStartCard(null);
    setSelectedCard(null);
  };

  const handleCardDrop = (targetCard, e) => {
    e.preventDefault();
    if (!dragStartCard || targetCard.type !== 'definition' || isCardConnected(targetCard)) {
      handleCardDragEnd();
      return;
    }
    attemptConnection(dragStartCard, targetCard);
    handleCardDragEnd();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleMouseMove = (e) => {
    if (!gameBoardRef.current) return;
    const rect = gameBoardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const computePathForPair = (startEl, endEl) => {
    if (!startEl || !endEl || !gameBoardRef.current) return '';
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    const s = startEl.getBoundingClientRect();
    const t = endEl.getBoundingClientRect();

    const startX = s.right - boardRect.left;
    const startY = s.top + s.height / 2 - boardRect.top;
    const endX = t.left - boardRect.left;
    const endY = t.top + t.height / 2 - boardRect.top;

    const controlX1 = startX + (endX - startX) * 0.3;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.7;
    const controlY2 = endY;

    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
  };

  const recomputeAllPaths = useCallback(() => {
    if (!gameBoardRef.current) return;

    const newPaths = connections.map(conn => {
      const termCard = cards.find(c => c.uniqueId === conn.termId);
      const defCard = cards.find(c => c.uniqueId === conn.definitionId);
      if (!termCard || !defCard) return null;
      const termEl = document.querySelector(`[data-card-id="${termCard.uniqueId}"]`);
      const defEl = document.querySelector(`[data-card-id="${defCard.uniqueId}"]`);
      const d = computePathForPair(termEl, defEl);
      return { id: conn.id, d, isCorrect: conn.isCorrect };
    }).filter(Boolean);

    setSvgPaths(newPaths);
  }, [connections, cards]);

  useEffect(() => {
    recomputeAllPaths();
  }, [connections, cards, recomputeAllPaths]);

  useEffect(() => {
    const handler = () => recomputeAllPaths();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [recomputeAllPaths]);

  const liveDragPath = () => {
    if (!isDragging || !dragStartCard || !gameBoardRef.current) return '';
    const startEl = document.querySelector(`[data-card-id="${dragStartCard.uniqueId}"]`);
    if (!startEl) return '';
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    const s = startEl.getBoundingClientRect();
    const startX = s.right - boardRect.left;
    const startY = s.top + s.height / 2 - boardRect.top;
    const endX = mousePosition.x;
    const endY = mousePosition.y;
    const controlX1 = startX + (endX - startX) * 0.3;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.7;
    const controlY2 = endY;
    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
  };

  const terms = cards.filter(c => c.type === 'term');
  const definitions = cards.filter(c => c.type === 'definition');

  // Landing screen
  if (!gameStarted) {
    const currentGame = gameData[moduleId] || gameData['planting-techniques'];

    return (
      <div className="landing-page">
        <div className="landing-content">
          <div className="game-logo">
            <i className="fas fa-leaf-heart"></i>
            <h1>Planting Techniques Match</h1>
            <p className="game-subtitle">Test your cacao farming knowledge</p>
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
                  <h3>Select a Technique</h3>
                  <p>Click or drag a planting technique from the middle column</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">2</div>
                <div className="step-info">
                  <h3>Match Definition</h3>
                  <p>Connect it to the correct definition on the right</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">3</div>
                <div className="step-info">
                  <h3>Watch Feedback</h3>
                  <p><span className="correct-demo">Green</span> = Correct | <span className="incorrect-demo">Red</span> = Try Again</p>
                </div>
              </div>
              <div className="play-step">
                <div className="step-icon">4</div>
                <div className="step-info">
                  <h3>Complete All Matches</h3>
                  <p>Match all {currentGame.length} techniques to win!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-buttons">
            <button className="btn-primary" onClick={startGame}>
              <i className="fas fa-play"></i>
              Start Game
            </button>
            <button className="btn-secondary" onClick={goBack}>
              <i className="fas fa-arrow-left"></i>
              Back to Lessons
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main game screen
  return (
    <>
      <div className="game-wrapper" onMouseMove={handleMouseMove}>
        {/* LEFT PANEL - Scoreboard & Controls */}
        <aside className="game-sidebar">
          <div className="sidebar-header">
            <i className="fas fa-leaf"></i>
            <h2>Planting Match</h2>
          </div>

          <div className="score-section">
            <div className="score-card correct-score">
              <div className="score-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="score-info">
                <div className="score-value">{correctConnections}</div>
                <div className="score-label">Correct</div>
              </div>
            </div>

            <div className="score-card moves-score">
              <div className="score-icon">
                <i className="fas fa-hand-pointer"></i>
              </div>
              <div className="score-info">
                <div className="score-value">{moves}</div>
                <div className="score-label">Total Moves</div>
              </div>
            </div>

            <div className="score-card progress-score">
              <div className="score-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="score-info">
                <div className="score-value">{correctConnections}/8</div>
                <div className="score-label">Progress</div>
              </div>
            </div>
          </div>

          <div className="controls-section">
            <button className="control-btn reset-btn" onClick={resetGame}>
              <i className="fas fa-redo"></i>
              Reset Game
            </button>
            <button className="control-btn back-btn" onClick={goBack}>
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
            <button
              className={`control-btn sound-btn ${soundEnabled ? 'sound-on' : 'sound-off'}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              <i className={soundEnabled ? "fas fa-volume-up" : "fas fa-volume-mute"}></i>
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </button>
          </div>
        </aside>

        {/* CENTER & RIGHT - Game Board */}
        <main className="game-main" ref={gameBoardRef}>
          {/* Connection Lines SVG */}
          <svg className="connections-svg">
            {svgPaths.map(p => (
              <path
                key={p.id}
                d={p.d}
                className={`connection-line ${p.isCorrect ? 'correct' : 'incorrect'}`}
              />
            ))}
            {isDragging && dragStartCard && (
              <path d={liveDragPath()} className="connection-line dragging" />
            )}
          </svg>

          {/* Visual Feedback Overlay */}
          {lastConnectionResult && (
            <div className={`feedback-overlay ${lastConnectionResult}`}>
              {lastConnectionResult === 'correct' ? (
                <>
                  <i className="fas fa-check-circle"></i>
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <i className="fas fa-times-circle"></i>
                  <span>Try Again</span>
                </>
              )}
            </div>
          )}

          <div className="cards-grid">
            {/* MIDDLE COLUMN - Techniques */}
            <div className="cards-column techniques-column">
              <div className="column-header">
                <i className="fas fa-seedling"></i>
                <h3>Planting Techniques</h3>
              </div>
              <div className="cards-scrollable">
                {terms.map(card => (
                  <div
                    key={card.uniqueId}
                    data-card-id={card.uniqueId}
                    className={`match-card ${selectedCard?.uniqueId === card.uniqueId ? 'selected' : ''} ${isCardConnected(card) ? 'connected' : ''}`}
                    onClick={() => handleCardClick(card)}
                    draggable={!isCardConnected(card)}
                    onDragStart={(e) => handleCardDragStart(card, e)}
                    onDragEnd={handleCardDragEnd}
                  >
                    <div className="card-icon">
                      <span role="img" aria-label={card.term}>{card.icon}</span>
                    </div>
                    <div className="card-text">{card.term}</div>
                    <div className="card-connector">
                      <div className="connector-dot"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN - Definitions */}
            <div className="cards-column definitions-column">
              <div className="column-header">
                <i className="fas fa-book-open"></i>
                <h3>Definitions</h3>
              </div>
              <div className="cards-scrollable">
                {definitions.map(card => (
                  <div
                    key={card.uniqueId}
                    data-card-id={card.uniqueId}
                    className={`match-card ${selectedCard?.uniqueId === card.uniqueId ? 'selected' : ''} ${isCardConnected(card) ? 'connected' : ''}`}
                    onClick={() => handleCardClick(card)}
                    onDrop={(e) => handleCardDrop(card, e)}
                    onDragOver={handleDragOver}
                  >
                    <div className="card-connector">
                      <div className="connector-dot"></div>
                    </div>
                    <div className="card-text">{card.definition}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Congratulations Popup */}
      {showCongrats && (
        <div className="game-completed">
          <div className="completed-content">
            {scoresSaved && (
              <div className="score-saved-banner">
                <i className="fas fa-trophy"></i>
                Score Saved Successfully!
              </div>
            )}
            <div className="congrats-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <h2>Congratulations!</h2>
            <p>You've matched all planting techniques!</p>

            <div className="game-stats">
              <div className="stat">
                <i className="fas fa-check-circle"></i>
                <div className="stat-value">{correctConnections}</div>
                <div className="stat-label">Correct</div>
              </div>
              <div className="stat">
                <i className="fas fa-hand-pointer"></i>
                <div className="stat-value">{moves}</div>
                <div className="stat-label">Moves</div>
              </div>
              <div className="stat">
                <i className="fas fa-percentage"></i>
                <div className="stat-value">{Math.round((correctConnections / moves) * 100)}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-primary" onClick={() => {
                setShowCongrats(false);
                resetGame();
              }}>
                <i className="fas fa-redo"></i>
                Play Again
              </button>
              <button className="btn-secondary" onClick={() => {
                setShowCongrats(false);
                goBack();
              }}>
                <i className="fas fa-arrow-left"></i>
                Back to Lessons
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MatchingCardsGame;
