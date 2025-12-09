import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        // Invalid token - redirect to login with error
        localStorage.setItem('verificationError', 'Invalid verification link');
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/users/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Verification successful - update status and auto-login the user
          setStatus('success');
          setMessage('Your email has been verified successfully! Redirecting to your dashboard...');
          
          // Store authentication data
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
          localStorage.setItem('isAuthenticated', 'true');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Verification failed - set error status
          setStatus('error');
          setMessage(result.message || 'Email verification failed. The link may have expired.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="login-container">
      <button
        className="back-to-home"
        onClick={() => navigate('/')}
        aria-label="Back to home"
      >
        ← Back to Home
      </button>

      <div className="login-illustration">
        <div className="illustration-overlay">
          <h2>AgriLearn Cacao</h2>
          <p>Email Verification</p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="login-card">
          <div className="form-header">
            <h1>Email Verification</h1>
          </div>

          <div className="verification-content" style={{
            padding: '2rem',
            textAlign: 'center'
          }}>
            {status === 'verifying' && (
              <div>
                <div className="spinner" style={{
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #8B5A2B',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p style={{ fontSize: '1.1rem', color: '#666' }}>{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  fontSize: '4rem',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                }}>
                  ✓
                </div>
                <h2 style={{
                  color: '#10b981',
                  marginBottom: '1rem',
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}>
                  Email Verified Successfully!
                </h2>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#666',
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  {message}
                </p>
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #86efac'
                }}>
                  <p style={{ fontSize: '0.95rem', color: '#166534', margin: 0 }}>
                    ✨ Your account is now active. Click the button below to sign in.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="auth-button"
                  style={{
                    marginTop: '1rem',
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    width: '100%',
                    background: 'linear-gradient(135deg, #8B5A2B, #D4A76A)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 4px 12px rgba(139, 90, 43, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(139, 90, 43, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(139, 90, 43, 0.3)';
                  }}
                >
                  Sign In to Your Account
                </button>
              </div>
            )}

            {status === 'error' && (
              <div>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  fontSize: '4rem',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)'
                }}>
                  ✕
                </div>
                <h2 style={{
                  color: '#ef4444',
                  marginBottom: '1rem',
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}>
                  Verification Link Expired
                </h2>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#666',
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  {message}
                </p>
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <p style={{ fontSize: '0.95rem', color: '#991b1b', margin: 0, marginBottom: '0.5rem' }}>
                    <strong>Don't worry!</strong> You can request a new verification email.
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#991b1b', margin: 0 }}>
                    Go to the login page and click "Resend Verification Email"
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="auth-button"
                  style={{
                    marginTop: '1rem',
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    width: '100%',
                    background: 'linear-gradient(135deg, #8B5A2B, #D4A76A)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 4px 12px rgba(139, 90, 43, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(139, 90, 43, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(139, 90, 43, 0.3)';
                  }}
                >
                  Go to Login Page
                </button>
              </div>
            )}
          </div>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
