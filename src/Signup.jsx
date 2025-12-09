import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [userRole, setUserRole] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!firstName?.trim()) {
        throw new Error('First name is required');
      }
      if (!surname?.trim()) {
        throw new Error('Surname is required');
      }
      if (!birthdate) {
        throw new Error('Birthdate is required');
      }
      if (!userRole) {
        throw new Error('Please select your role (Farmer or Student)');
      }
      if (!password) {
        throw new Error('Password is required');
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords don't match!");
      }

      // Validate password length
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // For students, validate email
      if (userRole === 'student') {
        if (!email?.trim()) {
          throw new Error('Email is required for students');
        }
        if (!email.endsWith('@gmail.com')) {
          throw new Error('Students must use a Gmail account');
        }
      }

      // For farmers, validate email
      if (userRole === 'farmer') {
        if (!email?.trim()) {
          throw new Error('Email is required for farmers');
        }
      }

      // Validate birthdate (must be at least 13 years old)
      const birthdateObj = new Date(birthdate);
      const age = Math.floor((Date.now() - birthdateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 13) {
        throw new Error('You must be at least 13 years old to register');
      }

      // Prepare user data
      const userData = {
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        surname: surname.trim(),
        birthdate: birthdate,
        userRole: userRole.toLowerCase(),
        password: password,
        email: email.trim(),
        ...(contactNumber && { contactNumber: contactNumber.trim() }),
        ...(address && { address: address.trim() }),
        ...(gender && { gender })
      };

      console.log('Sending registration data:', {
        ...userData,
        password: '***'
      });

      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (!response.ok) {
        throw new Error(result?.message || 'Registration failed. Please try again.');
      }

      if (!result || result.success === false) {
        throw new Error(result?.message || 'Registration was not successful');
      }

      // Handle success - both roles need email verification
      if (result.requiresVerification) {
        alert(`Registration successful! A verification email has been sent to ${result.email}. Please check your inbox and verify your email before logging in.`);
        navigate('/login');
      } else {
        alert('Registration successful! You can now login.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.message || 'An error occurred. Please try again.');
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
          <p>Join our community of cacao enthusiasts</p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="login-card">
          <div className="form-header">
            <h1>Create Account</h1>
            <p className="subtitle">Join our community of cacao enthusiasts</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name Fields - First */}
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="firstName">First Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                  style={{
                    color: '#000000',
                    WebkitTextFillColor: '#000000',
                    caretColor: '#000000',
                    backgroundColor: '#ffffff !important',
                    '::placeholder': {
                      color: '#000000',
                      opacity: 0.5
                    }
                  }}
                />
              </div>
              <div className="form-group half-width">
                <label htmlFor="surname">Surname <span className="required">*</span></label>
                <input
                  type="text"
                  id="surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Enter your surname"
                  required
                  style={{
                    color: '#000000',
                    WebkitTextFillColor: '#000000',
                    caretColor: '#000000',
                    backgroundColor: '#ffffff !important'
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="middleName">Middle Name (Optional)</label>
              <input
                type="text"
                id="middleName"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Enter your middle name (if any)"
                style={{
                  color: '#000000',
                  WebkitTextFillColor: '#000000',
                  caretColor: '#000000',
                  backgroundColor: '#ffffff !important'
                }}
              />
            </div>

            {/* Birthdate - Right After Middle Name */}
            <div className="form-group">
              <label htmlFor="birthdate">Birthdate <span className="required">*</span></label>
              <input
                type="date"
                id="birthdate"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                required
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                style={{
                  color: '#000000',
                  WebkitTextFillColor: '#000000',
                  caretColor: '#000000',
                  backgroundColor: '#ffffff !important',
                  colorScheme: 'light'
                }}
              />
              <small style={{ color: '#666', fontSize: '0.85rem' }}>
                You must be at least 13 years old to register
              </small>
            </div>

            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="userRole">I am a <span className="required">*</span></label>
              <select
                id="userRole"
                value={userRole}
                onChange={(e) => {
                  setUserRole(e.target.value);
                  // Reset email when role changes
                  setEmail('');
                }}
                required
                className="form-select"
                style={{
                  color: userRole ? '#000000' : '#9ca3af',
                  backgroundColor: '#ffffff !important',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1em',
                  paddingRight: '2.5rem',
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>Select your role</option>
                <option value="farmer">Farmer</option>
                <option value="student">Student</option>
              </select>
            </div>

            {/* Email Field - For Both Roles */}
            {userRole && (
              <div key="email-field" className="form-group">
                <label htmlFor="email">
                  EMAIL ADDRESS <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={userRole === 'student' ? 'Enter your Gmail address' : 'Enter your email address'}
                  required
                  pattern={userRole === 'student' ? '[a-zA-Z0-9._%+-]+@gmail\.com' : undefined}
                  style={{
                    color: '#666666',
                    WebkitTextFillColor: '#666666',
                    caretColor: '#000000',
                    backgroundColor: '#ffffff !important'
                  }}
                />
                <small style={{ color: '#666', fontSize: '0.85rem' }}>
                  You'll receive a verification email at this address
                </small>
              </div>
            )}

            {/* Gender */}
            <div className="form-group">
              <label htmlFor="gender">Gender <span className="required">*</span></label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className="form-select"
                style={{
                  color: gender ? '#000000' : '#9ca3af',
                  backgroundColor: '#ffffff !important',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1em',
                  paddingRight: '2.5rem',
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            {/* Optional Fields */}
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your address"
                style={{
                  color: '#000000',
                  WebkitTextFillColor: '#000000',
                  caretColor: '#000000',
                  backgroundColor: '#ffffff !important'
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number</label>
              <input
                type="tel"
                id="contactNumber"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Your contact number"
                style={{
                  color: '#000000',
                  WebkitTextFillColor: '#000000',
                  caretColor: '#000000',
                  backgroundColor: '#ffffff !important'
                }}
              />
            </div>

            {/* Password Fields */}
            <div className="form-group">
              <label htmlFor="password">Password <span className="required">*</span></label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 6 characters)"
                  required
                  minLength="6"
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
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                style={{
                  color: '#000000',
                  WebkitTextFillColor: '#000000',
                  caretColor: '#000000',
                  backgroundColor: '#ffffff !important'
                }}
              />
            </div>

            <button type="submit" className="auth-button">
              Sign Up
            </button>

            <p className="form-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
