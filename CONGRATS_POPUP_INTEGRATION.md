# CongratsPopup Integration Guide

## ✅ Completed
- **PestDiseaseGame.jsx** - Successfully integrated with CongratsPopup
- **MemoryGame.jsx** - Successfully integrated with CongratsPopup

## 📝 Remaining Games to Update

### 1. CacaoProcessingGame.jsx

**Step 1:** Add import at the top (after line 4):
```javascript
import CongratsPopup from './components/CongratsPopup';
```

**Step 2:** Replace the win overlay (lines 315-346) with:
```javascript
<CongratsPopup
  show={gameStatus === 'won'}
  title="Congratulations!"
  message="You've successfully processed cacao into chocolate!"
  stats={[
    { value: score, label: "Final Score" },
    { value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), label: "Difficulty" }
  ]}
  onPlayAgain={() => startGame(difficulty)}
  onBackToMenu={handleBackToLessons}
/>
```

---

### 2. MatchingCardsGame.jsx

**Step 1:** Add import at the top (around line 3):
```javascript
import CongratsPopup from './components/CongratsPopup';
```

**Step 2:** Find the `if (gameCompleted)` section and replace the entire results display with:
```javascript
if (gameCompleted) {
  const currentGame = gameData[moduleId] || gameData['planting-techniques'];
  
  return (
    <CongratsPopup
      show={gameCompleted}
      title="Congratulations!"
      message={`You matched ${correctConnections} out of ${currentGame.length} correctly!`}
      stats={[
        { value: `${correctConnections}/${currentGame.length}`, label: "Correct" },
        { value: moves, label: "Moves" },
        { value: formatTime(gameTime), label: "Time" },
        { value: `${calculateAccuracy()}%`, label: "Accuracy" }
      ]}
      onPlayAgain={() => { resetGame(); setGameStarted(true); }}
      onBackToMenu={goBack}
      playAgainText="Play Again"
      backToMenuText="Continue"
    />
  );
}
```

---

## 🎨 CongratsPopup Component Props

- **show** (boolean): Controls visibility
- **title** (string): Main title (default: "Congratulations!")
- **message** (string): Subtitle message
- **stats** (array): Array of `{ value, label }` objects
- **onPlayAgain** (function): Callback for "Play Again" button
- **onBackToMenu** (function): Callback for "Back to Menu" button
- **playAgainText** (string, optional): Custom text for play again button
- **backToMenuText** (string, optional): Custom text for back button

## 🎯 Benefits

✅ Consistent design across all games
✅ Animated trophy and confetti
✅ Beautiful gradient purple background
✅ Responsive and mobile-friendly
✅ Easy to maintain - one component for all games
