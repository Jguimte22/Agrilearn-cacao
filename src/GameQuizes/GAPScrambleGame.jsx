// src/GameQuizes/GAPScrambleGame.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaPlay, FaRedo, FaLightbulb, FaTrophy, FaClock, FaStar, FaFire, FaRocket, FaGem, FaPause, FaCheck } from 'react-icons/fa';
import quizScoreAPI from '../services/quizScoreAPI';
import './GAPScrambleGame.css';

const GAPScrambleGame = () => {
  const navigate = useNavigate();
  const audioContextRef = useRef(null);
  const musicOscillatorsRef = useRef([]);
  const musicGainNodeRef = useRef(null);
  const musicLfoRef = useRef(null);
  const inputRef = useRef(null);
  const [gameState, setGameState] = useState('landing');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false, message: '', highlightColor: '' });
  const [shuffledWord, setShuffledWord] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [stars, setStars] = useState(3);
  const [timeBonus, setTimeBonus] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [levelScore, setLevelScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [shuffledLevels, setShuffledLevels] = useState([]);
  const [powerUps, setPowerUps] = useState({
    hint: 3,
    timeFreeze: 2,
    shuffle: 3
  });
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Initialize audio context
  const getAudioContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const startBackgroundMusic = () => {
    if (musicOscillatorsRef.current.length > 0) return; // Already playing

    try {
      const audioContext = getAudioContext();

      // Create a more complex jolly background music with multiple oscillators
      musicGainNodeRef.current = audioContext.createGain();
      musicGainNodeRef.current.gain.setValueAtTime(0.08, audioContext.currentTime); // Slightly louder for jolly feel

      // Create LFO for vibrato effect
      musicLfoRef.current = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      musicLfoRef.current.frequency.setValueAtTime(5, audioContext.currentTime); // 5Hz vibrato
      lfoGain.gain.setValueAtTime(10, audioContext.currentTime); // 10 cents vibrato depth
      musicLfoRef.current.connect(lfoGain);

      // Main melody oscillator (sine wave for smooth, happy sound)
      const mainOscillator = audioContext.createOscillator();
      mainOscillator.type = 'sine';
      mainOscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4

      // Harmony oscillator (slightly detuned for richness)
      const harmonyOscillator = audioContext.createOscillator();
      harmonyOscillator.type = 'triangle';
      harmonyOscillator.frequency.setValueAtTime(554.37, audioContext.currentTime); // C#5 (major third)

      // Bass oscillator (for rhythm)
      const bassOscillator = audioContext.createOscillator();
      bassOscillator.type = 'sine';
      bassOscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3

      // Connect LFO to main oscillator for vibrato
      lfoGain.connect(mainOscillator.frequency);

      // Create individual gains for each oscillator
      const mainGain = audioContext.createGain();
      const harmonyGain = audioContext.createGain();
      const bassGain = audioContext.createGain();

      mainGain.gain.setValueAtTime(0.4, audioContext.currentTime);
      harmonyGain.gain.setValueAtTime(0.3, audioContext.currentTime);
      bassGain.gain.setValueAtTime(0.2, audioContext.currentTime);

      // Connect oscillators to their gains
      mainOscillator.connect(mainGain);
      harmonyOscillator.connect(harmonyGain);
      bassOscillator.connect(bassGain);

      // Connect gains to main gain
      mainGain.connect(musicGainNodeRef.current);
      harmonyGain.connect(musicGainNodeRef.current);
      bassGain.connect(musicGainNodeRef.current);

      // Connect main gain to destination
      musicGainNodeRef.current.connect(audioContext.destination);

      // Start all oscillators
      mainOscillator.start();
      harmonyOscillator.start();
      bassOscillator.start();
      musicLfoRef.current.start();

      // Store references
      musicOscillatorsRef.current = [mainOscillator, harmonyOscillator, bassOscillator];

      // Create a super jolly and intense melody - very cheerful and upbeat
      const melodyPattern = [
        { freq: 659.25, duration: 0.2 },  // E5 - Bright start
        { freq: 783.99, duration: 0.2 },  // G5 - Happy rise
        { freq: 880, duration: 0.2 },     // A5 - Cheerful
        { freq: 987.77, duration: 0.3 },  // B5 - Excitement
        { freq: 1046.5, duration: 0.2 },  // C6 - High energy
        { freq: 987.77, duration: 0.2 },  // B5 - Bounce down
        { freq: 880, duration: 0.2 },     // A5 - Continue joy
        { freq: 783.99, duration: 0.2 },  // G5 - Playful
        { freq: 659.25, duration: 0.2 },  // E5 - Upbeat
        { freq: 587.33, duration: 0.2 },  // D5 - Build
        { freq: 659.25, duration: 0.2 },  // E5 - Rise again
        { freq: 783.99, duration: 0.2 },  // G5 - Climax building
        { freq: 880, duration: 0.2 },     // A5 - Almost there
        { freq: 987.77, duration: 0.3 },  // B5 - Peak excitement
        { freq: 1174.66, duration: 0.4 }, // D6 - Super high joy!
        { freq: 1046.5, duration: 0.3 },  // C6 - Resolve happy
        { freq: 880, duration: 0.5 },     // A5 - Joyful ending
      ];

      let currentTime = audioContext.currentTime;
      melodyPattern.forEach((note, index) => {
        mainOscillator.frequency.setValueAtTime(note.freq, currentTime);
        harmonyOscillator.frequency.setValueAtTime(note.freq * 1.25, currentTime); // Major third harmony
        bassOscillator.frequency.setValueAtTime(note.freq / 2, currentTime); // Bass octave
        currentTime += note.duration;
      });

      // Loop the melody
      const loopMelody = () => {
        if (musicOscillatorsRef.current.length === 0) return; // Stop if music is off

        let loopTime = audioContext.currentTime;
        melodyPattern.forEach((note) => {
          if (musicOscillatorsRef.current[0]) {
            musicOscillatorsRef.current[0].frequency.setValueAtTime(note.freq, loopTime);
            musicOscillatorsRef.current[1].frequency.setValueAtTime(note.freq * 1.25, loopTime);
            musicOscillatorsRef.current[2].frequency.setValueAtTime(note.freq / 2, loopTime);
          }
          loopTime += note.duration;
        });

        // Schedule next loop
        const totalDuration = melodyPattern.reduce((sum, note) => sum + note.duration, 0);
        setTimeout(loopMelody, totalDuration * 1000);
      };

      // Start looping
      const totalDuration = melodyPattern.reduce((sum, note) => sum + note.duration, 0);
      setTimeout(loopMelody, totalDuration * 1000);

    } catch (e) {
      console.log('Audio context error:', e);
    }
  };

  const stopBackgroundMusic = () => {
    if (musicOscillatorsRef.current.length > 0 && musicGainNodeRef.current) {
      try {
        const audioContext = getAudioContext();
        musicGainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

        setTimeout(() => {
          // Stop all oscillators
          musicOscillatorsRef.current.forEach(oscillator => {
            if (oscillator) {
              try {
                oscillator.stop();
              } catch (e) {
                // Oscillator might already be stopped
              }
            }
          });

          // Stop LFO
          if (musicLfoRef.current) {
            try {
              musicLfoRef.current.stop();
            } catch (e) {
              // LFO might already be stopped
            }
          }

          musicOscillatorsRef.current = [];
          musicLfoRef.current = null;
        }, 500);
      } catch (e) {
        console.log('Audio stop error:', e);
      }
    }
  };

  // Sound effect generator
  const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      console.log('Tone error:', e);
    }
  };

  // Sound effects using generated tones
  const sounds = {
    correct: { play: () => playTone(800, 0.2, 'sine') }, // High pitch success
    wrong: { play: () => playTone(200, 0.3, 'sawtooth') }, // Low pitch error
    powerup: { play: () => { playTone(600, 0.1); setTimeout(() => playTone(900, 0.1), 100); } }, // Rising tones
    levelup: { play: () => { playTone(523, 0.15); setTimeout(() => playTone(659, 0.15), 150); setTimeout(() => playTone(784, 0.2), 300); } }, // Victory melody
    click: { play: () => playTone(400, 0.05, 'square') }, // Short click
    gameOver: { play: () => { playTone(400, 0.2); setTimeout(() => playTone(350, 0.2), 200); setTimeout(() => playTone(300, 0.4), 400); } }, // Descending tones
    typing: { play: () => playTone(600, 0.05, 'square', 0.1) } // Typing sound effect
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
      const audioContext = getAudioContext();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  // Game levels with categories and difficulty
  const levels = [
    {
      category: 'Soil Management',
      question: 'What is the process of turning and loosening the soil to prepare it for planting?',
      answer: 'TILLING',
      points: 10,
      hint: 'Starts with T'
    },
    {
      category: 'Water Management',
      question: 'What method supplies water directly to plant roots through pipes and tubes?',
      answer: 'IRRIGATION',
      points: 10,
      hint: 'Starts with I'
    },
    {
      category: 'Pest Control',
      question: 'What are beneficial organisms that naturally control harmful pests?',
      answer: 'PREDATORS',
      points: 10,
      hint: 'Starts with P'
    },
    {
      category: 'Crop Rotation',
      question: 'What is the practice of growing different crops in the same area in sequential seasons?',
      answer: 'ROTATION',
      points: 10,
      hint: 'Starts with R'
    },
    {
      category: 'Organic Farming',
      question: 'What natural material made from decomposed plants and food waste improves soil fertility?',
      answer: 'COMPOST',
      points: 10,
      hint: 'Starts with C'
    },
    {
      category: 'Fertilizer Management',
      question: 'What is the process of adding nutrients to soil to improve plant growth?',
      answer: 'FERTILIZE',
      points: 10,
      hint: 'Starts with F'
    },
    {
      category: 'Weed Control',
      question: 'What is the removal of unwanted plants that compete with crops for nutrients?',
      answer: 'WEEDING',
      points: 10,
      hint: 'Starts with W'
    },
    {
      category: 'Harvesting',
      question: 'What is the process of gathering mature crops from the fields?',
      answer: 'HARVEST',
      points: 10,
      hint: 'Starts with H'
    },
    {
      category: 'Seed Selection',
      question: 'What is the process of choosing the best seeds for planting?',
      answer: 'SEEDING',
      points: 10,
      hint: 'Starts with S'
    },
    {
      category: 'Soil Conservation',
      question: 'What is the protection of soil from erosion and degradation?',
      answer: 'CONSERVE',
      points: 10,
      hint: 'Starts with C'
    }
  ];

  // Start the game
  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(0);
    setScore(0);
    setTimeLeft(60);
    setStreak(0);
    setCombo(0);
    setMultiplier(1);

    // Shuffle the levels array randomly
    const shuffled = [...levels].sort(() => Math.random() - 0.5);
    setShuffledLevels(shuffled);

    // Generate first word immediately using the shuffled array
    if (shuffled.length > 0) {
      const word = shuffled[0].answer;
      const shuffledWordText = shuffleWord(word);
      setShuffledWord(shuffledWordText);
      setUserGuess('');
      setHintUsed(false);
    }

    // Play sound effects and start background music
    if (!isMuted) sounds.levelup.play();
    if (!isMusicPlaying) {
      startBackgroundMusic();
      setIsMusicPlaying(true);
    }
  };

  // Generate a new shuffled word
  const generateNewWord = () => {
    if (shuffledLevels.length === 0 || !shuffledLevels[currentLevel]) {
      console.error('No levels available or invalid current level');
      return;
    }
    const current = shuffledLevels[currentLevel];
    const word = current.answer;
    const shuffled = shuffleWord(word);
    setShuffledWord(shuffled);
    setUserGuess('');
    setHintUsed(false);
  };

  // Shuffle word function
  const shuffleWord = (word) => {
    let shuffled = word.split('');
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.join('');
  };

  // Check user's answer
  const checkAnswer = () => {
    // Blur input to dismiss keyboard on mobile
    if (inputRef.current) {
      inputRef.current.blur();
    }
    const current = shuffledLevels[currentLevel];
    const isCorrect = userGuess.toUpperCase() === current.answer;

    if (isCorrect) {
      const timeBonus = Math.ceil(timeLeft / 5);
      const comboBonus = combo * 5;
      const wordScore = (current.points * multiplier) + timeBonus + comboBonus;

      setScore(prevScore => prevScore + wordScore);
      setCombo(prevCombo => prevCombo + 1);
      setStreak(prevStreak => prevStreak + 1);
      if (combo > maxCombo) setMaxCombo(combo);
      if (!isMuted) sounds.correct.play();
      setFeedback({
        show: true,
        isCorrect,
        message: 'Correct!',
        highlightColor: '#28a745'
      });
      setTimeout(() => {
        setFeedback({ show: false, isCorrect: false, message: '', highlightColor: '' });
        nextLevel();
      }, 1500);
    } else {
      setStreak(0);
      setCombo(0);
      if (!isMuted) sounds.wrong.play();

      // Show red highlight and proceed to next word after delay
      setFeedback({
        show: true,
        isCorrect,
        message: `Incorrect! The answer was ${current.answer}`,
        highlightColor: '#dc3545'
      });

      setTimeout(() => {
        setFeedback({ show: false, isCorrect: false, message: '', highlightColor: '' });
        nextLevel();
      }, 2000); // 2 second delay before moving to next word
    }
  };

  // Move to next level
  const nextLevel = () => {
    if (currentLevel < shuffledLevels.length - 1) {
      setCurrentLevel(prev => prev + 1);
    } else {
      // Game completed
      setGameState('gameOver');
    }
  };

  // Regenerate word when level changes
  useEffect(() => {
    if (gameState === 'playing' && currentLevel >= 0 && currentLevel < shuffledLevels.length) {
      generateNewWord();
    }
  }, [currentLevel, gameState]);

  // Use power-up
  const usePowerUp = (type) => {
    if (powerUps[type] <= 0) return;

    switch (type) {
      case 'hint':
        const hint = shuffledLevels[currentLevel].answer[0];
        setUserGuess(prev => prev + hint);
        break;
      case 'timeFreeze':
        setTimeLeft(prev => prev + 10);
        break;
      case 'shuffle':
        const reshuffled = shuffleWord(shuffledLevels[currentLevel].answer);
        setShuffledWord(reshuffled);
        break;
    }

    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    if (!isMuted) sounds.powerup.play();
  };

  // PowerUpButton component
  const PowerUpButton = ({ type, icon: Icon, onClick }) => (
    <button
      className={`power-up ${type} ${powerUps[type] <= 0 ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={powerUps[type] <= 0}
    >
      <Icon />
      <span className="power-up-count">{powerUps[type]}</span>
    </button>
  );

  // Game timer effect
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('gameOver');
          // Stop background music and play game over sound
          stopBackgroundMusic();
          setIsMusicPlaying(false);
          if (!isMuted) sounds.gameOver.play();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, isPaused]);

  // Save quiz score when game ends
  useEffect(() => {
    if (gameState === 'gameOver' && score > 0) {
      const saveScore = async () => {
        try {
          const totalQuestions = levels.length;
          const correctAnswers = currentLevel; // Assuming currentLevel represents completed questions
          const percentageScore = Math.round((score / (totalQuestions * 100)) * 100); // Calculate percentage
          const timeTaken = 60 - timeLeft; // Time spent

          await quizScoreAPI.saveScore(
            'gap-practices-quiz', // quizId
            percentageScore, // score (0-100)
            totalQuestions, // totalQuestions
            correctAnswers, // correctAnswers
            timeTaken // timeTaken in seconds
          );

          console.log('✅ Quiz score saved successfully!');
          setScoreSaved(true);

          // Hide notification after 5 seconds
          setTimeout(() => {
            setScoreSaved(false);
          }, 5000);
        } catch (error) {
          console.error('❌ Error saving quiz score:', error);
        }
      };

      saveScore();
    }
  }, [gameState, score, currentLevel, timeLeft]);

  return (
    <div className="gap-scramble-game" style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3)), url(/CaremanageBg.png) center/cover no-repeat fixed',
      zIndex: '1'
    }}>
      {gameState === 'landing' && (
        <div className="gap-scramble-landing">
          <div className="gap-scramble-wrapper">
            <div className="landing-header">
              <div className="game-icon" style={{ color: '#FFD700' }}><FaGem /></div>
              <h1>GAP Word Master</h1>
              <p className="game-tagline">Master Good Agricultural Practices by unscrambling the terms!</p>
            </div>

            <div className="game-description">
              <h3><FaLightbulb /> How to Play</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : 'repeat(2, 1fr)',
                gap: '1rem',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.8rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 69, 19, 0.1)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>1</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', color: '#8B4513' }}>See Scrambled Word</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#5D4E37' }}>Look at the mixed-up letters centered on screen.</p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.8rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 69, 19, 0.1)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>2</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', color: '#8B4513' }}>Type or Click</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#5D4E37' }}>Type your answer in the box to solve it.</p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.8rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 69, 19, 0.1)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>3</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', color: '#8B4513' }}>Build Combos</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#5D4E37' }}>Answer quickly and accurately to multiple points.</p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.8rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 69, 19, 0.1)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>4</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', color: '#8B4513' }}>Use Power-ups</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#5D4E37' }}>Stuck? Use hints or shuffle to help you out.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="gap-button-group">
              <button
                className="btn btn-outline"
                onClick={() => navigate('/courses/gap-practices/lessons')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
              >
                <FaArrowLeft /> Back to Lessons
              </button>
              <button
                className="btn btn-primary"
                onClick={startGame}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
              >
                Start Game <FaPlay />
              </button>
            </div>
            <p className="start-hint" style={{
              margin: '0.5rem 0 0 0',
              fontSize: '0.9rem',
              color: '#64748b',
              textAlign: 'center'
            }}>Ready to challenge yourself?</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {gameState === 'playing' && (
          <div className="game-container" style={{
            position: window.innerWidth <= 480 ? 'absolute' : 'fixed',
            top: window.innerWidth <= 480 ? '0' : '50%',
            left: window.innerWidth <= 480 ? '0' : '50%',
            transform: window.innerWidth <= 480 ? 'none' : 'translate(-50%, -50%)',
            width: '100vw',
            height: window.innerWidth <= 480 ? 'auto' : '100vh',
            minHeight: '100vh',
            background: 'linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.4)), url(/CaremanageBg.png) center/cover no-repeat fixed',
            padding: window.innerWidth <= 480 ? '2rem 0.75rem 20rem 0.75rem' : '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: window.innerWidth <= 480 ? 'flex-start' : 'center',
            alignItems: 'center',
            gap: window.innerWidth <= 480 ? '1rem' : '2rem',
            overflowY: window.innerWidth <= 480 ? 'visible' : 'hidden'
          }}>
            <div className="game-header-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <div className="cacao-game-header-v2">
                <div className="header-section controls-section">
                  <button
                    className="header-control-btn btn-menu"
                    onClick={() => {
                      if (!isMuted) sounds.click.play();
                      setGameState('landing');
                      stopBackgroundMusic();
                      setIsMusicPlaying(false);
                    }}
                  >
                    <FaArrowLeft />
                    Menu
                  </button>
                  <button
                    className="header-control-btn btn-reset"
                    onClick={() => {
                      if (!isMuted) sounds.click.play();
                      startGame();
                    }}
                  >
                    <FaRedo />
                    Reset
                  </button>
                </div>

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
                    {combo >= 5 ? <FaFire /> : <FaCheck />}
                  </div>
                  <div className="header-content">
                    <span className="header-label">Combo</span>
                    <span className={`header-value ${combo >= 5 ? 'combo-streak' : ''}`}>
                      {combo >= 5 ? `🔥 ${combo}` : combo}
                    </span>
                  </div>
                </div>

                <div className="header-section time-section">
                  <div className="header-icon">
                    <FaClock />
                  </div>
                  <div className="header-content">
                    <span className="header-label">Time</span>
                    <span className="header-value">{timeLeft}s</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="game-content" style={{
              background: 'rgba(255, 255, 255, 1)',
              backdropFilter: 'blur(15px)',
              borderRadius: window.innerWidth <= 480 ? '15px' : '20px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
              width: '100%',
              maxWidth: window.innerWidth <= 480 ? '95%' : '800px',
              minHeight: window.innerWidth <= 480 ? 'auto' : '500px',
              maxHeight: '80vh',
              padding: window.innerWidth <= 480 ? '1rem 1rem 2rem 1rem' : '2rem 2rem 4rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: window.innerWidth <= 480 ? '0.75rem' : '1rem',
              justifyContent: 'flex-start',
              alignItems: 'center',
              overflow: 'visible'
            }}>
              <div className="level-info" style={{
                textAlign: 'center',
                position: 'relative',
                minHeight: '120px',
                overflow: 'visible'
              }}>
                <h2 style={{
                  fontSize: window.innerWidth <= 480 ? '1.2rem' : '2rem',
                  color: '#000000',
                  fontWeight: '700',
                  margin: '0 0 0.5rem 0',
                  textShadow: '2px 2px 4px rgba(255, 255, 255, 0.9)'
                }}>Level {currentLevel + 1}: {shuffledLevels[currentLevel]?.category || 'Loading...'}</h2>
                <p className="question" style={{
                  fontSize: window.innerWidth <= 480 ? '0.9rem' : '1.2rem',
                  color: '#333333',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  height: window.innerWidth <= 480 ? 'auto' : '60px',
                  overflow: 'auto',
                  margin: '0',
                  padding: '0 0.5rem'
                }}>{shuffledLevels[currentLevel]?.question || 'Loading question...'}</p>
              </div>

              <div className="scramble-container" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                alignItems: 'center',
                position: 'relative',
                padding: '1rem',
                borderRadius: '20px',
                border: feedback.show ? `4px solid ${feedback.highlightColor}` : '4px solid transparent',
                background: 'transparent',
                transition: 'all 0.3s ease',
                boxShadow: feedback.show
                  ? `0 0 30px ${feedback.highlightColor}40`
                  : 'none',
                overflow: 'visible',
                zIndex: '1'
              }}>
                <div className="scramble-word" style={{
                  fontSize: window.innerWidth <= 480 ? '1.5rem' : '3rem',
                  fontWeight: '700',
                  color: '#8B4513',
                  letterSpacing: window.innerWidth <= 480 ? '0.2rem' : '0.5rem',
                  textTransform: 'uppercase',
                  padding: window.innerWidth <= 480 ? '1rem' : '1.5rem',
                  background: 'linear-gradient(135deg, #fff7ed 0%, #fff1e6 100%)',
                  borderRadius: '15px',
                  border: '3px solid #8B4513',
                  boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
                  textAlign: 'center'
                }}>{shuffledWord || 'Loading...'}</div>

                <div className="user-input" style={{
                  display: 'flex',
                  gap: '1rem',
                  width: '100%',
                  maxWidth: '500px'
                }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={userGuess}
                    onChange={(e) => {
                      const newValue = e.target.value.toUpperCase();
                      setUserGuess(newValue);

                      // Play typing sound effect for each character (except when deleting)
                      if (newValue.length > userGuess.length && !isMuted) {
                        sounds.typing.play();
                      }
                    }}
                    placeholder="Type your answer..."
                    onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                    style={{
                      flex: 1,
                      padding: window.innerWidth <= 480 ? '0.75rem 1rem' : '1rem 1.5rem',
                      fontSize: window.innerWidth <= 480 ? '1rem' : '1.5rem',
                      fontWeight: '600',
                      color: '#000000',
                      background: 'rgba(255, 255, 255, 1)',
                      border: '3px solid #e0e0e0',
                      borderRadius: '15px',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: window.innerWidth <= 480 ? '0.1rem' : '0.3rem',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8B4513';
                      e.target.style.boxShadow = '0 4px 20px rgba(139, 69, 19, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    }}
                  />
                  <button
                    onClick={checkAnswer}
                    style={{
                      padding: window.innerWidth <= 480 ? '0.75rem 1.5rem' : '1rem 2rem',
                      fontSize: window.innerWidth <= 480 ? '1rem' : '1.2rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(139, 69, 19, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(139, 69, 19, 0.3)';
                    }}
                  >
                    Submit
                    <FaPlay />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {gameState === 'gameOver' && (
        <div className="game-completed">
          <div className="completed-content">
            <h2>Congratulations! </h2>
            <p>You've completed all the GAP challenges!</p>

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
                <FaTrophy style={{ fontSize: '20px' }} />
                Score Saved Successfully!
              </div>
            )}

            <div className="game-stats">
              <div className="stat">
                <span className="stat-value">{score}</span>
                <span className="stat-label">Final Score</span>
              </div>
              <div className="stat">
                <span className="stat-value">{maxCombo}x</span>
                <span className="stat-label">Max Combo</span>
              </div>
              <div className="stat">
                <span className="stat-value">{levels.length}</span>
                <span className="stat-label">Words Completed</span>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="primary-button"
                onClick={startGame}
              >
                Play Again
              </button>
              <button
                className="secondary-button"
                onClick={() => navigate('/courses/gap-practices/lessons')}
              >
                Back to Lessons
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
      </AnimatePresence>

      {showTutorial && (
        <div className="tutorial-overlay">
          <div className="tutorial-content">
            <h2>How to Play</h2>
            <p>Unscramble the letters to form the correct word related to Good Agricultural Practices.</p>
            <ul>
              <li>Type your answer in the input field</li>
              <li>Press Enter or click Submit to check your answer</li>
              <li>Earn points for correct answers</li>
              <li>Build combos for bonus points</li>
              <li>Use power-ups to help you when stuck</li>
            </ul>
            <button className="btn primary-btn" onClick={() => setShowTutorial(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GAPScrambleGame;