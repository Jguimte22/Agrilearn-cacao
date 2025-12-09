# Read the file
$content = Get-Content "src\CacaoProcessingGame.jsx" -Raw

# 1. Add the import after the CSS import
$content = $content -replace "import './CacaoProcessingGame.css';", "import './CacaoProcessingGame.css';`nimport CongratsPopup from './components/CongratsPopup';"

# 2. Replace the win overlay section
$oldWinOverlay = @"
      {gameStatus === 'won' && (
        <div className="game-overlay">
          <div className="game-result">
            <h2>Congratulations! 🎉</h2>
            <p>You've successfully processed cacao into chocolate!</p>
            <div className="final-score">Final Score: <span>{score}</span></div>
            <div className="difficulty-badge">
              Difficulty: <span className={``diff-`${difficulty}``}>{difficulty}</span>
            </div>
            <div className="button-group">
              <button 
                className="game-button play-again"
                onClick={() => startGame(difficulty)}
              >
                <FaPlay /> Play Again
              </button>
              <button 
                className="game-button back-to-menu"
                onClick={() => setGameStarted(false)}
              >
                <FaListUl /> Change Difficulty
              </button>
              <button 
                className="game-button back-to-lessons"
                onClick={handleBackToLessons}
              >
                <FaHome /> Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
"@

$newWinOverlay = @"
      <CongratsPopup
        show={gameStatus === 'won'}
        title="Congratulations!"
        message="You've successfully processed cacao into chocolate!"
        stats={[
          { value: score, label: "Final Score" },
          { value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), label: "Difficulty" },
          { value: ``${currentStep + 1}/${processingSteps.length}``, label: "Steps Completed" }
        ]}
        onPlayAgain={() => startGame(difficulty)}
        onBackToMenu={handleBackToLessons}
      />
"@

$content = $content -replace [regex]::Escape($oldWinOverlay), $newWinOverlay

# Write back to file
$content | Set-Content "src\CacaoProcessingGame.jsx" -NoNewline

Write-Host "✅ Successfully updated CacaoProcessingGame.jsx!" -ForegroundColor Green
