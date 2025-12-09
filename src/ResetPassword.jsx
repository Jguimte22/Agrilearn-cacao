import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './Login.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const { token } = useParams();

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/reset-password/${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setTokenValid(true);
          setUserEmail(data.email || '');
        } else {
          setMessage({
            type: 'error',
            text: data.message || 'Invalid or expired reset link'
          });
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setMessage({
          type: 'error',
          text: 'Error verifying reset link. Please try again.'
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`http://localhost:5000/api/users/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: data.message || 'Password reset successful! Redirecting to login...'
        });
        setPassword('');
        setConfirmPassword('');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to reset password. Please try again.'
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="login-container">
        <div className="login-form-container" style={{ width: '100%' }}>
          <div className="login-card">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #8B5A2B',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: '#666' }}>Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="login-container">
        <button
          className="back-to-home"
          onClick={() => navigate('/login')}
          aria-label="Back to login"
        >
          ← Back to Login
        </button>

        <div className="login-form-container" style={{ width: '100%' }}>
          <div className="login-card">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '2rem',
                color: 'white'
              }}>
                ✕
              </div>
              <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>Invalid Reset Link</h2>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                {message?.text || 'This password reset link is invalid or has expired.'}
              </p>
              <Link to="/forgot-password" className="auth-button" style={{
                display: 'inline-block',
                textDecoration: 'none',
                padding: '0.875rem 1.5rem'
              }}>
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <p>Create a new password for your account</p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="login-card">
          <div className="form-header">
            <h1>Reset Password</h1>
            {userEmail && (
              <p className="subtitle" style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                Creating new password for: <strong>{userEmail}</strong>
              </p>
            )}
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
            <div className="form-group">
              <label htmlFor="password">New Password <span className="required">*</span></label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
