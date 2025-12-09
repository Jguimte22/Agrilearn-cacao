import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [message, setMessage] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendOTP = async () => {
    // Validate required fields for sending OTP
    if (!formData.email) {
      setMessage({
        type: 'error',
        text: 'Please enter your email address'
      });
      return;
    }

    // Validate Gmail format
    if (!formData.email.endsWith('@gmail.com')) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid Gmail address'
      });
      return;
    }

    setSendingOTP(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/users/send-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          contactNumber: '0000000000', // Dummy number for backend compatibility
          userRole: 'student' // Default role for backend compatibility
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpSent(true);

        setMessage({
          type: 'success',
          text: 'OTP has been sent to your Gmail address. Please check your inbox.'
        });
        localStorage.setItem('recentOTP', JSON.stringify({
          code: data.otp,
          phone: data.phoneNumber,
          timestamp: new Date().toISOString()
        }));
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to send OTP. Please check your email and try again.'
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred while sending OTP. Please try again.'
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (!formData.newPassword || !formData.confirmPassword || !formData.otp) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields'
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long'
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match'
      });
      return;
    }

    if (formData.otp.length !== 6) {
      setMessage({
        type: 'error',
        text: 'OTP must be 6 digits'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/users/verify-otp-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          contactNumber: '0000000000', // Dummy number for backend compatibility
          userRole: 'student', // Default role for backend compatibility
          otp: formData.otp,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: 'Password reset successful! Redirecting to login...'
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to reset password. Please try again.'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <button
        className="back-to-home"
        onClick={() => navigate('/login')}
        aria-label="Back to login"
      >
        ← Back to Login
      </button>

      <div className="login-illustration">
        <div className="illustration-overlay">
          <h2>AgriLearn Cacao</h2>
          <p>Reset your password securely with Gmail OTP verification</p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="login-card">
          <div className="form-header">
            <h1>Reset Password</h1>
            <p className="subtitle" style={{ fontSize: '0.95rem', color: '#666', marginTop: '0.5rem' }}>
              Enter your Gmail address to receive an OTP for password reset
            </p>
          </div>

          {message && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '8px',
              border: `2px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
              backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: message.type === 'success'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white',
                flexShrink: 0
              }}>
                {message.type === 'success' ? '✓' : '✕'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  margin: 0,
                  color: message.type === 'success' ? '#166534' : '#991b1b',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  lineHeight: '1.5'
                }}>
                  {message.text}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMessage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: message.type === 'success' ? '#166534' : '#991b1b',
                  cursor: 'pointer',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email Address <span className="required">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your registered email"
                required
                disabled={loading || sendingOTP}
                style={{
                  color: '#000000',
                  WebkitTextFillColor: '#000000',
                  caretColor: '#000000',
                  backgroundColor: '#ffffff !important'
                }}
              />
            </div>

            {/* Send OTP Button */}
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={sendingOTP || !formData.email}
              className="submit-btn"
              style={{
                width: '80%',
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                margin: '1.5rem auto',
                background: 'linear-gradient(135deg, #d05e00 0%, #ff7b00 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: (sendingOTP || !formData.email) ? 'not-allowed' : 'pointer',
                opacity: (sendingOTP || !formData.email) ? 0.7 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(208, 94, 0, 0.2)',
                textTransform: 'none',
                letterSpacing: '0.5px'
              }}
            >
              {sendingOTP ? (
                <>
                  <div className="spinner" style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid #ffffff', 
                    borderTop: '2px solid transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  Sending OTP...
                </>
              ) : (
                'Send OTP to Gmail'
              )}
            </button>

            {/* OTP Input (shown after OTP is sent) */}
            {otpSent && (
              <>
                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label htmlFor="otp">Enter OTP <span className="required">*</span></label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Enter 6-digit OTP"
                    required
                    maxLength="6"
                    disabled={loading}
                    style={{
                      color: '#000000',
                      WebkitTextFillColor: '#000000',
                      caretColor: '#000000',
                      backgroundColor: '#ffffff !important',
                      fontSize: '1.2rem',
                      letterSpacing: '0.5rem',
                      textAlign: 'center'
                    }}
                  />
                  <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    OTP sent to {phoneDisplay}. Expires in 10 minutes.
                  </p>
                </div>

                {/* Resend OTP */}
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={sendingOTP || loading}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: '#8B5A2B',
                    border: 'none',
                    cursor: sendingOTP ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {sendingOTP ? 'Sending...' : 'Resend OTP'}
                </button>

                {/* New Password */}
                <div className="form-group">
                  <label htmlFor="newPassword">New Password <span className="required">*</span></label>
                  <div className="password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password (min. 6 characters)"
                      required
                      disabled={loading}
                      style={{
                        color: '#000000',
                        WebkitTextFillColor: '#000000',
                        caretColor: '#000000',
                        backgroundColor: '#ffffff !important',
                        width: '100%'
                      }}
                    />
                    <button
                      type="button"
                      className={`toggle-password ${showPassword ? 'show' : 'hide'}`}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="eye-icon"></span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                  <div className="password-input">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your new password"
                      required
                      disabled={loading}
                      style={{
                        color: '#000000',
                        WebkitTextFillColor: '#000000',
                        caretColor: '#000000',
                        backgroundColor: '#ffffff !important',
                        width: '100%'
                      }}
                    />
                    <button
                      type="button"
                      className={`toggle-password ${showConfirmPassword ? 'show' : 'hide'}`}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      <span className="eye-icon"></span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.875rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    width: '100%',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </>
            )}
          </form>

          <div className="form-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="text-button">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
