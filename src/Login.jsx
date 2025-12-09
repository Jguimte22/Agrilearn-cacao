import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [verificationNotification, setVerificationNotification] = useState(null);
  const navigate = useNavigate();

  // Check if user is already authenticated and redirect them
  useEffect(() => {
    const checkAuthStatus = () => {
      // Check both localStorage and sessionStorage for tokens
      const userToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

      if (userToken) {
        // User is already logged in, redirect to dashboard
        console.log('User already authenticated, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }

      if (adminToken) {
        // Admin is already logged in, redirect to admin dashboard
        console.log('Admin already authenticated, redirecting to admin dashboard');
        navigate('/admin/dashboard');
        return;
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // Check for verification notifications
  useEffect(() => {
    const emailVerified = localStorage.getItem('emailVerified');
    const verificationMessage = localStorage.getItem('verificationMessage');
    const verificationError = localStorage.getItem('verificationError');

    if (emailVerified === 'true' && verificationMessage) {
      setVerificationNotification({ type: 'success', message: verificationMessage });
      localStorage.removeItem('emailVerified');
      localStorage.removeItem('verificationMessage');

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setVerificationNotification(null);
      }, 8000);
    } else if (verificationError) {
      setVerificationNotification({ type: 'error', message: verificationError });
      localStorage.removeItem('verificationError');

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setVerificationNotification(null);
      }, 8000);
    }
  }, []);

  const clearAuthData = () => {
    const keys = ['token', 'user', 'adminToken', 'admin'];
    keys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Verification email sent! Please check your inbox and spam folder.');
        setShowResendVerification(false);
      } else {
        alert(data.message || 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      email: email.trim().toLowerCase(),
      password
    };

    const storage = rememberMe ? localStorage : sessionStorage;

    const handleUserSuccess = (data) => {
      clearAuthData();
      storage.setItem('token', data.token);
      storage.setItem('user', JSON.stringify(data.user));

      if (['admin', 'superadmin'].includes(data.user?.role)) {
        storage.setItem('adminToken', data.token);
        storage.setItem('admin', JSON.stringify(data.user));
        // Set a flag that will be checked by the dashboard
        sessionStorage.setItem('showWelcomeNotification', 'true');
        console.log('Admin role detected from user collection, redirecting to admin dashboard');
        sessionStorage.setItem('hasSeenWelcome', 'false'); // Reset welcome flag for admin
        navigate('/admin/dashboard');
      } else {
        // Set a flag that will be checked by the dashboard
        sessionStorage.setItem('showWelcomeNotification', 'true');
        console.log('User authenticated, redirecting to /dashboard');
        sessionStorage.setItem('hasSeenWelcome', 'false'); // Reset welcome flag for user
        navigate('/dashboard');
      }
    };

    const handleAdminSuccess = (data) => {
      clearAuthData();
      storage.setItem('adminToken', data.token);
      storage.setItem('admin', JSON.stringify(data.admin));
      console.log('Admin authenticated via admin collection, redirecting to /admin/dashboard');
      sessionStorage.setItem('hasSeenWelcome', 'false'); // Reset welcome flag for admin
      navigate('/admin/dashboard');
    };

    const attemptLogin = async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return { response, data };
    };

    setLoading(true);

    try {
      console.log('Attempting user login with:', { email: payload.email });
      const { response: userResponse, data: userData } = await attemptLogin('http://localhost:5000/api/users/login');

      // Check if user login requires verification
      if (!userResponse.ok && userData.requiresVerification) {
        setShowResendVerification(true);
        alert(userData.message + '\n\nClick the "Resend Verification Email" button below to get a new verification link.');
        setLoading(false);
        return;
      }

      if (userResponse.ok && userData.success && userData.token && userData.user) {
        handleUserSuccess(userData);
        return;
      }

      console.warn('User login failed, attempting admin login', userData);
      const { response: adminResponse, data: adminData } = await attemptLogin('http://localhost:5000/api/admin/login');
      if (adminResponse.ok && adminData.success && adminData.token && adminData.admin) {
        handleAdminSuccess(adminData);
        return;
      }

      throw new Error(adminData.message || userData.message || 'Login failed. Please check your credentials.');
    } catch (error) {
      console.error('Authentication error:', error);

      // Check if it's an email verification error
      if (error.message && error.message.toLowerCase().includes('verify')) {
        setShowResendVerification(true);
        alert(error.message + '\n\nClick the "Resend Verification Email" button below to get a new verification link.');
      } else {
        alert(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


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
          <p>Master the art of cacao cultivation with our comprehensive learning platform</p>
        </div>
      </div>
      
      <div className="login-form-container">
        <div className="login-card">
          <div className="form-header">
            Welcome to Agrilearn Cacao!
          </div>

          {/* Verification Notification */}
          {verificationNotification && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '8px',
              border: `2px solid ${verificationNotification.type === 'success' ? '#10b981' : '#ef4444'}`,
              backgroundColor: verificationNotification.type === 'success' ? '#f0fdf4' : '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: verificationNotification.type === 'success'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white',
                flexShrink: 0
              }}>
                {verificationNotification.type === 'success' ? '✓' : '✕'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  margin: 0,
                  color: verificationNotification.type === 'success' ? '#166534' : '#991b1b',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  lineHeight: '1.5'
                }}>
                  {verificationNotification.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVerificationNotification(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: verificationNotification.type === 'success' ? '#166534' : '#991b1b',
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
              <label htmlFor="email">Email Address <span className="required">*</span></label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  color: '#000000',
                  WebkitTextFillColor: '#000000',
                  caretColor: '#000000',
                  backgroundColor: '#ffffff !important'
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password <span className="required">*</span></label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
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

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-button"
                style={{
                  marginLeft: 'auto',
                  color: '#8B5A2B',
                  textDecoration: 'none',
                  fontSize: '0.9rem'
                }}
              >
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="auth-button" disabled={loading} style={{
              marginTop: '1.5rem',
              padding: '0.875rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              width: '100%',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {showResendVerification && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                style={{
                  marginTop: '1rem',
                  padding: '0.875rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  width: '100%',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: resendingEmail ? 'not-allowed' : 'pointer',
                  opacity: resendingEmail ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {resendingEmail ? 'Sending...' : '📧 Resend Verification Email'}
              </button>
            )}
          </form>

          <div className="form-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="text-button">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;