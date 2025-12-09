const fs = require('fs');
const path = require('path');

// File paths
const matchingCardsPath = path.join(__dirname, 'src', 'MatchingCardsGame.jsx');
const cacaoProcessingPath = path.join(__dirname, 'src', 'CacaoProcessingGame.jsx');

// Read MatchingCardsGame.jsx
let matchingCards = fs.readFileSync(matchingCardsPath, 'utf8');

// 1. Add import for CongratsPopup
matchingCards = matchingCards.replace(
    "import './MatchingCardsGame.css';",
    "import './MatchingCardsGame.css';\nimport CongratsPopup from './components/CongratsPopup';"
);

// 2. Replace the completion screen (find the section starting with "// Completed screen")
const completionStart = matchingCards.indexOf('  // Completed screen - show results on game board');
const completionEnd = matchingCards.indexOf('  // Main game board\n  return (');

if (completionStart !== -1 && completionEnd !== -1) {
    const beforeCompletion = matchingCards.substring(0, completionStart);
    const afterCompletion = matchingCards.substring(completionEnd);

    const newCompletion = `  // Completed screen - show results with CongratsPopup
  if (gameCompleted) {
    const currentGame = gameData[moduleId] || gameData['planting-techniques'];
    const earned = [];
    
    // Award badges based on performance
    if (correctConnections === currentGame.length) earned.push('Perfect Match');
    if (incorrectAttempts === 0) earned.push('No Mistakes');
    if (correctConnections >= currentGame.length * 0.8) earned.push('Good Score');

    return (
      <CongratsPopup
        show={gameCompleted}
        title="Congratulations!"
        message={\`You matched \${correctConnections} out of \${currentGame.length} correctly!\`}
        stats={[
          { value: \`\${correctConnections}/\${currentGame.length}\`, label: "Correct Matches" },
          { value: moves, label: "Total Moves" },
          { value: incorrectAttempts, label: "Incorrect Attempts" },
          { value: earned.length > 0 ? earned.join(', ') : 'Keep Practicing!', label: "Badges Earned" }
        ]}
        onPlayAgain={() => { resetGame(); setGameStarted(true); }}
        onBackToMenu={goBack}
        playAgainText="Play Again"
        backToMenuText="Continue"
      />
    );
  }

  `;

    matchingCards = beforeCompletion + newCompletion + afterCompletion;
}

// Write back MatchingCardsGame.jsx
fs.writeFileSync(matchingCardsPath, matchingCards, 'utf8');
console.log('✅ Updated MatchingCardsGame.jsx');

// Read CacaoProcessingGame.jsx
let cacaoProcessing = fs.readFileSync(cacaoProcessingPath, 'utf8');

// 1. Add import for CongratsPopup
cacaoProcessing = cacaoProcessing.replace(
    "import './CacaoProcessingGame.css';",
    "import './CacaoProcessingGame.css';\nimport CongratsPopup from './components/CongratsPopup';"
);

// 2. Replace the win overlay
const winOverlayPattern = /\s+{gameStatus === 'won' && \(\s+<div className="game-overlay">[\s\S]*?<\/div>\s+<\/div>\s+\)\}/;
const newWinOverlay = `
      <CongratsPopup
        show={gameStatus === 'won'}
        title="Congratulations!"
        message="You've successfully processed cacao into chocolate!"
        stats={[
          { value: score, label: "Final Score" },
          { value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), label: "Difficulty" },
          { value: \`\${currentStep + 1}/\${processingSteps.length}\`, label: "Steps Completed" }
        ]}
        onPlayAgain={() => startGame(difficulty)}
        onBackToMenu={handleBackToLessons}
      />`;

cacaoProcessing = cacaoProcessing.replace(winOverlayPattern, newWinOverlay);

// Write back CacaoProcessingGame.jsx
fs.writeFileSync(cacaoProcessingPath, cacaoProcessing, 'utf8');
console.log('✅ Updated CacaoProcessingGame.jsx');

console.log('\n🎉 All games have been updated with the standardized CongratsPopup!');
