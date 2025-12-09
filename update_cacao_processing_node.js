const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/CacaoProcessingGame.jsx', 'utf8');

// 1. Add the import after the CSS import
content = content.replace(
    "import './CacaoProcessingGame.css';",
    "import './CacaoProcessingGame.css';\nimport CongratsPopup from './components/CongratsPopup';"
);

// 2. Find and replace the win overlay section
const startMarker = "      {gameStatus === 'won' && (";
const endMarker = "      )}";

const startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
    // Find the matching closing parenthesis
    let depth = 0;
    let endIndex = startIndex;
    let foundStart = false;

    for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '(' && content.substring(i - 5, i + 1) === " && (") {
            foundStart = true;
            depth = 1;
            continue;
        }
        if (foundStart) {
            if (content[i] === '(') depth++;
            if (content[i] === ')') depth--;
            if (depth === 0) {
                endIndex = i + 1;
                // Check if next chars are newline and spaces for proper formatting
                while (content[endIndex] === '\r' || content[endIndex] === '\n' || content[endIndex] === ' ') {
                    if (content[endIndex] === '\n') break;
                    endIndex++;
                }
                break;
            }
        }
    }

    const newWinOverlay = `      <CongratsPopup
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

    content = content.substring(0, startIndex) + newWinOverlay + content.substring(endIndex);
}

// Write back to file
fs.writeFileSync('src/CacaoProcessingGame.jsx', content, 'utf8');

console.log('✅ Successfully updated CacaoProcessingGame.jsx!');
