import re

# Read the file
with open('src/CacaoProcessingGame.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add the import after the CSS import
content = content.replace(
    "import './CacaoProcessingGame.css';",
    "import './CacaoProcessingGame.css';\nimport CongratsPopup from './components/CongratsPopup';"
)

# 2. Replace the win overlay section - using a more flexible regex
win_overlay_pattern = r"      \{gameStatus === 'won' && \(\s+<div className=\"game-overlay\">.*?</div>\s+</div>\s+\)\}"

new_win_overlay = """      <CongratsPopup
        show={gameStatus === 'won'}
        title="Congratulations!"
        message="You've successfully processed cacao into chocolate!"
        stats={[
          { value: score, label: "Final Score" },
          { value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), label: "Difficulty" },
          { value: `${currentStep + 1}/${processingSteps.length}`, label: "Steps Completed" }
        ]}
        onPlayAgain={() => startGame(difficulty)}
        onBackToMenu={handleBackToLessons}
      />"""

content = re.sub(win_overlay_pattern, new_win_overlay, content, flags=re.DOTALL)

# Write back to file
with open('src/CacaoProcessingGame.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully updated CacaoProcessingGame.jsx!")
