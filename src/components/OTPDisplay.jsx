import React, { useState, useEffect } from 'react';
import './OTPDisplay.css';

const OTPDisplay = () => {
  const [recentOTPs, setRecentOTPs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for OTP events from localStorage
    const handleOTPEvent = (e) => {
      if (e.key === 'recentOTP') {
        const otpData = JSON.parse(e.newValue);
        setRecentOTPs(prev => [otpData, ...prev.slice(0, 4)]); // Keep last 5 OTPs
        setIsVisible(true);
        
        // Auto-hide after 10 seconds
        setTimeout(() => setIsVisible(false), 10000);
      }
    };

    window.addEventListener('storage', handleOTPEvent);
    
    // Check for existing OTPs on mount
    const existingOTP = localStorage.getItem('recentOTP');
    if (existingOTP) {
      setRecentOTPs([JSON.parse(existingOTP)]);
      setIsVisible(true);
    }

    return () => window.removeEventListener('storage', handleOTPEvent);
  }, []);

  const clearOTPs = () => {
    setRecentOTPs([]);
    localStorage.removeItem('recentOTP');
    setIsVisible(false);
  };

  if (!isVisible || recentOTPs.length === 0) {
    return null;
  }

  return (
    <div className="otp-display-container">
      <div className="otp-display-header">
        <h3>🔐 Recent OTP Codes</h3>
        <button onClick={clearOTPs} className="clear-btn">Clear</button>
      </div>
      {recentOTPs.map((otp, index) => (
        <div key={index} className="otp-item">
          <div className="otp-info">
            <span className="otp-code">{otp.code}</span>
            <span className="otp-phone">{otp.phone}</span>
          </div>
          <div className="otp-time">
            {new Date(otp.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OTPDisplay;
