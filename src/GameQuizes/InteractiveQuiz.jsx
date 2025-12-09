import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTrophy, FaStar, FaCheck, FaTimes, FaArrowRight, FaClock } from 'react-icons/fa';
import './InteractiveQuiz.css';
import CongratsPopup from '../components/CongratsPopup';

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
      { note: 523.25, duration: beatDuration * 0.25, volume: 0.06 }, // C5
      { note: 523.25, duration: beatDuration * 0.25, volume: 0.06 }, // C5
      { note: 587.33, duration: beatDuration * 0.25, volume: 0.06 }, // D5
      { note: 659.25, duration: beatDuration * 0.25, volume: 0.06 }, // E5
      { note: 659.25, duration: beatDuration * 0.25, volume: 0.06 }, // E5
      { note: 587.33, duration: beatDuration * 0.25, volume: 0.06 }, // D5
      { note: 523.25, duration: beatDuration * 0.5, volume: 0.06 },  // C5
      { note: 392.00, duration: beatDuration * 0.5, volume: 0.06 },  // G4
      { note: 523.25, duration: beatDuration * 0.25, volume: 0.06 }, // C5
      { note: 523.25, duration: beatDuration * 0.25, volume: 0.06 }, // C5
      { note: 587.33, duration: beatDuration * 0.25, volume: 0.06 }, // D5
      { note: 659.25, duration: beatDuration * 0.25, volume: 0.06 }, // E5
      { note: 659.25, duration: beatDuration * 0.25, volume: 0.06 }, // E5
      { note: 587.33, duration: beatDuration * 0.25, volume: 0.06 }, // D5
      { note: 523.25, duration: beatDuration * 0.5, volume: 0.06 },  // C5
      { note: 392.00, duration: beatDuration * 0.5, volume: 0.06 },  // G4
    ];

    // Bass line for fuller sound
    const bassLine = [
      { note: 261.63, duration: beatDuration * 1, volume: 0.03 }, // C4
      { note: 392.00, duration: beatDuration * 1, volume: 0.03 }, // G4
      { note: 261.63, duration: beatDuration * 1, volume: 0.03 }, // C4
      { note: 392.00, duration: beatDuration * 1, volume: 0.03 }, // G4
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

// Sound effects using Web Audio API
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
      case 'correct':
        // Happy correct sound - major chord arpeggio
        createNote(523.25, now, 0.15, 0.12); // C5
        createNote(659.25, now + 0.1, 0.15, 0.10); // E5
        createNote(783.99, now + 0.2, 0.15, 0.08); // G5
        break;

      case 'incorrect':
        // Gentle error sound - soft descending tone
        createNote(440.00, now, 0.1, 0.06); // A4
        createNote(349.23, now + 0.08, 0.12, 0.04); // F4
        createNote(293.66, now + 0.15, 0.15, 0.02); // D4
        break;

      case 'click':
        // Click sound
        createNote(800, now, 0.05, 0.08);
        break;

      case 'complete':
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
    }
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};

const InteractiveQuiz = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Background music control
  useEffect(() => {
    if (gameStarted && !showResult) {
      // Play music when game starts
      playBackgroundMusic();
    } else if (showResult) {
      // Stop music when game ends
      stopBackgroundMusic();
    }

    // Cleanup when component unmounts
    return () => {
      stopBackgroundMusic();
    };
  }, [gameStarted, showResult]);

  // Function to save quiz results
  const saveQuizResult = (score, totalQuestions) => {
    const result = {
      id: Date.now(),
      courseId,
      courseTitle: getCourseTitle(courseId),
      quizTitle: getQuizTitle(courseId, moduleId),
      score,
      totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      type: 'quiz',
      date: new Date().toISOString(),
      timestamp: Date.now()
    };

    const existingResults = JSON.parse(localStorage.getItem('userQuizResults') || '[]');
    const updatedResults = [result, ...existingResults].slice(0, 50); // Keep last 50 results
    localStorage.setItem('userQuizResults', JSON.stringify(updatedResults));

    // Update course progress
    updateCourseProgress(courseId, result.courseTitle, score, totalQuestions);
  };

  const updateCourseProgress = (courseId, courseTitle, quizScore, totalQuestions) => {
    const existingProgress = JSON.parse(localStorage.getItem('userCourseProgress') || '[]');
    const courseIndex = existingProgress.findIndex(course => course.courseId === courseId);

    const newProgress = {
      courseId,
      courseTitle,
      quizScore: Math.round((quizScore / totalQuestions) * 100),
      assignmentScore: 0,
      finalGrade: 0,
      progress: 100, // Mark as completed
      status: 'Completed',
      lastUpdated: new Date().toISOString()
    };

    if (courseIndex >= 0) {
      existingProgress[courseIndex] = { ...existingProgress[courseIndex], ...newProgress };
      existingProgress[courseIndex].finalGrade = Math.round(
        (existingProgress[courseIndex].quizScore + existingProgress[courseIndex].assignmentScore) / 2
      );
    } else {
      existingProgress.push(newProgress);
    }

    localStorage.setItem('userCourseProgress', JSON.stringify(existingProgress));
  };

  const getCourseTitle = (courseId) => {
    const titles = {
      'cacao-varieties': 'Cacao Varieties',
      'cacao-cultivation': 'Cacao Cultivation Basics',
      'soil-health': 'Soil Health for Cacao',
      'pest-management': 'Organic Pest Management'
    };
    return titles[courseId] || 'Unknown Course';
  };

  const getQuizTitle = (courseId, moduleId) => {
    const titles = {
      'cacao-varieties': 'Cacao Varieties Quiz',
      'cacao-cultivation': 'Cacao Cultivation Quiz',
      'soil-health': 'Soil Health Quiz',
      'pest-management': 'Pest Management Quiz'
    };
    return titles[courseId] || 'Quiz';
  };

  // Quiz data
  const quizData = {
    'cacao-varieties': {
      title: 'Cacao Varieties Quiz',
      questions: [
        {
          id: 1,
          question: 'Which cacao variety is known as the "prince of cocoas"?',
          options: [
            { id: 'a', text: 'Forastero' },
            { id: 'b', text: 'Criollo', isCorrect: true },
            { id: 'c', text: 'Trinitario' },
            { id: 'd', text: 'Nacional' }
          ],
          explanation: 'Criollo is often called the "prince of cocoas" due to its fine flavor and aroma.'
        },
        {
          id: 2,
          question: 'What percentage of the world\'s cacao production comes from Forastero?',
          options: [
            { id: 'a', text: '10-15%' },
            { id: 'b', text: '30-40%' },
            { id: 'c', text: '60-70%' },
            { id: 'd', text: '80-90%', isCorrect: true }
          ],
          explanation: 'Forastero accounts for about 80-90% of the world\'s cacao production.'
        },
        {
          id: 3,
          question: 'Which cacao variety is a hybrid between Criollo and Forastero?',
          options: [
            { id: 'a', text: 'Trinitario', isCorrect: true },
            { id: 'b', text: 'Nacional' },
            { id: 'c', text: 'Amelonado' },
            { id: 'd', text: 'Porcelana' }
          ],
          explanation: 'Trinitario is a natural hybrid that combines the hardiness of Forastero with the fine flavor of Criollo.'
        }
      ]
    }
  };

  const currentQuiz = quizData[moduleId] || quizData['cacao-varieties'];
  const currentQuestion = currentQuiz.questions[currentQuestionIndex];
  const totalQuestions = currentQuiz.questions.length;

  useEffect(() => {
    if (timeLeft > 0 && !showFeedback) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showFeedback) {
      handleTimeUp();
    }
  }, [timeLeft, showFeedback]);

  // Start game when component mounts
  useEffect(() => {
    setGameStarted(true);
  }, []);

  const handleOptionSelect = (option) => {
    if (showFeedback) return;

    // Play click sound
    playSound('click');

    setSelectedOption(option.id);
    const correct = option.isCorrect;
    setIsCorrect(correct);

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(Math.max(maxStreak, newStreak));
      setScore(score + (10 + Math.min(timeLeft, 10)));
      // Play correct sound
      playSound('correct');
    } else {
      setStreak(0);
      // Play incorrect sound
      playSound('incorrect');
    }

    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setTimeLeft(30);
      } else {
        setShowResult(true);
        // Play completion sound
        playSound('complete');
        // Save quiz results when completed
        saveQuizResult(score, totalQuestions);
      }
    }, 2000);
  };

  const handleTimeUp = () => {
    setShowFeedback(true);
    setIsCorrect(false);
    setStreak(0);

    setTimeout(() => {
      setShowFeedback(false);
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setTimeLeft(30);
      } else {
        setShowResult(true);
        // Save quiz results when completed
        saveQuizResult(score, totalQuestions);
      }
    }, 2000);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setShowResult(false);
    setSelectedOption(null);
  };

  const getProgressWidth = () => {
    return ((currentQuestionIndex + (showFeedback ? 1 : 0)) / totalQuestions) * 100;
  };

  if (showResult) {
    const percentage = Math.round((score / (totalQuestions * 20)) * 100);
    return (
      <CongratsPopup
        show={showResult}
        title="Quiz Complete!"
        message={`You scored ${percentage}%`}
        stats={[
          { value: score, label: "Score" },
          { value: `${percentage}%`, label: "Accuracy" },
          { value: maxStreak, label: "Max Streak" }
        ]}
        onPlayAgain={restartQuiz}
        onBackToMenu={() => navigate(`/lessons/${courseId}/${moduleId}`)}
        playAgainText="Try Again"
        backToMenuText="Back to Lessons"
      />
    );
  }

  return (
    <div className="gamified-quiz">
      <div className="quiz-header">
        <div className="quiz-progress">
          <div
            className="progress-bar"
            style={{ width: `${getProgressWidth()}%` }}
          ></div>
        </div>
        <div className="quiz-stats">
          <span className="question-count">
            Question {currentQuestionIndex + 1}/{totalQuestions}
          </span>
          <span className="score">
            Score: <strong>{score}</strong>
          </span>
          <span className="streak">
            Streak: {streak} <FaStar className="streak-icon" />
          </span>
          <span className="timer">
            <FaClock /> {timeLeft}s
          </span>
        </div>
      </div>

      <div className={`quiz-content ${showFeedback ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
        <div className="question-container">
          <h2>{currentQuestion.question}</h2>
          <div className="options-grid">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                className={`option-btn ${selectedOption === option.id
                    ? option.isCorrect
                      ? 'correct'
                      : 'incorrect'
                    : ''
                  } ${showFeedback && option.isCorrect ? 'show-correct' : ''
                  }`}
                onClick={() => handleOptionSelect(option)}
                disabled={showFeedback}
              >
                <span className="option-letter">{option.id.toUpperCase()}</span>
                <span className="option-text">{option.text}</span>
                {showFeedback && option.isCorrect && (
                  <FaCheck className="feedback-icon correct" />
                )}
                {selectedOption === option.id && !option.isCorrect && (
                  <FaTimes className="feedback-icon incorrect" />
                )}
              </button>
            ))}
          </div>
        </div>

        {showFeedback && (
          <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-content">
              {isCorrect ? (
                <div className="correct-answer">
                  <FaCheck className="feedback-icon" />
                  <span>Correct! {currentQuestion.explanation}</span>
                </div>
              ) : (
                <div className="wrong-answer">
                  <FaTimes className="feedback-icon" />
                  <span>Incorrect. {currentQuestion.explanation}</span>
                </div>
              )}
              <div className="streak-message">
                {streak >= 2 && (
                  <span className="streak-bonus">
                    {streak} in a row! Keep it up! <FaStar />
                  </span>
                )}
              </div>
            </div>
            <button
              className="next-btn"
              onClick={() => {
                setShowFeedback(false);
                if (currentQuestionIndex < totalQuestions - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setSelectedOption(null);
                  setTimeLeft(30);
                } else {
                  setShowResult(true);
                }
              }}
            >
              {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'See Results'}
              <FaArrowRight className="arrow-icon" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveQuiz;