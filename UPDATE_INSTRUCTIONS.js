// Quick Update Script for CongratsPopup Integration
// Run this in your browser console while viewing the files

console.log(`
==============================================
CONGRATS POPUP INTEGRATION INSTRUCTIONS
==============================================

✅ COMPLETED GAMES:
- PestDiseaseGame.jsx
- MemoryGame.jsx

📝 REMAINING GAMES TO UPDATE MANUALLY:

-------------------------------------------
1. CACAO PROCESSING GAME
-------------------------------------------

File: src/CacaoProcessingGame.jsx

Step 1: Add import (line 5, after the CSS import):
import CongratsPopup from './components/CongratsPopup';

Step 2: Find this code (around line 315-346):
{gameStatus === 'won' && (
  <div className="game-overlay">
    <div className="game-result">
      <h2>Congratulations! 🎉</h2>
      ...entire overlay div...
    </div>
  </div>
)}

Step 3: Replace with:
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

-------------------------------------------
2. MATCHING CARDS GAME  
-------------------------------------------

File: src/MatchingCardsGame.jsx

Step 1: Add import (around line 3):
import CongratsPopup from './components/CongratsPopup';

Step 2: Find the "if (gameCompleted)" section (around line 548)

Step 3: Replace the entire return statement inside with:
if (gameCompleted) {
  const currentGame = gameData[moduleId] || gameData['planting-techniques'];
  
  return (
    <CongratsPopup
      show={gameCompleted}
      title="Congratulations!"
      message={\`You matched \${correctConnections} out of \${currentGame.length} correctly!\`}
      stats={[
        { value: \`\${correctConnections}/\${currentGame.length}\`, label: "Correct" },
        { value: moves, label: "Moves" },
        { value: formatTime(gameTime), label: "Time" },
        { value: \`\${calculateAccuracy()}%\`, label: "Accuracy" }
      ]}
      onPlayAgain={() => { resetGame(); setGameStarted(true); }}
      onBackToMenu={goBack}
      playAgainText="Play Again"
      backToMenuText="Continue"
    />
  );
}

==============================================
BENEFITS:
✨ Consistent purple gradient design
🏆 Animated trophy with bounce effect
🎊 Confetti animation
📱 Fully responsive
🎯 Same look across all games
==============================================
`);
