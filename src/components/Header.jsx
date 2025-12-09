import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoClicked, setLogoClicked] = React.useState(false);

  useEffect(() => {
    // Use global mobile menu state if available
    if (window.isMobileMenuOpen !== undefined) {
      setMobileMenuOpen(window.isMobileMenuOpen);
    } else if (isMobileMenuOpen !== undefined) {
      setMobileMenuOpen(isMobileMenuOpen);
    }
  }, [isMobileMenuOpen]);

  const handleMobileMenuToggle = () => {
    if (window.toggleMobileMenu) {
      window.toggleMobileMenu();
    } else if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogoClick = () => {
    setLogoClicked(true);
  };

  return (
    <header className="elearning-header">
      <div className="header-content">
        {/* Mobile Menu Toggle Button */}
        <button
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={handleMobileMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <div className="header-left">
          <h1
            className={`header-title ${logoClicked ? 'clicked' : ''}`}
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
          >
            AgriLearn Cacao
          </h1>
        </div>

        {/* Navigation - Desktop */}
        <nav className="elearning-nav">
          <Link to="/" className={`nav-item ${isActive('/')}`}>
            Home
          </Link>
          <Link to="/learn-planting" className={`nav-item ${isActive('/learn-planting')}`}>
            Learn Planting
          </Link>
          <Link to="/about" className={`nav-item ${isActive('/about')}`}>
            About Us
          </Link>
          <Link to="/contact" className={`nav-item ${isActive('/contact')}`}>
            Contact Us
          </Link>
          <Link to="/login" className="nav-item login-btn">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;