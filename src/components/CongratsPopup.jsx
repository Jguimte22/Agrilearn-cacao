import React from 'react';
import './CongratsPopup.css';

const CongratsPopup = ({
    show,
    title = "Congratulations!",
    message,
    stats = [],
    onPlayAgain,
    onBackToMenu,
    playAgainText = "Play Again",
    backToMenuText = "Back to Menu",
    children
}) => {
    if (!show) return null;

    return (
        <div className="congrats-overlay">
            <div className="congrats-popup">
                <div className="congrats-content">
                    {children}
                    <h2 className="congrats-title">{title}</h2>
                    {message && <p className="congrats-message">{message}</p>}

                    <div className="congrats-stats">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="congrats-actions">
                        {onPlayAgain && (
                            <button className="congrats-btn btn-primary" onClick={onPlayAgain}>
                                {playAgainText}
                            </button>
                        )}
                        {onBackToMenu && (
                            <button className="congrats-btn btn-outline" onClick={onBackToMenu}>
                                {backToMenuText}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CongratsPopup;
