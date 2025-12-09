import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FiX, FiHome, FiBook, FiInfo, FiPhone, FiLogIn } from 'react-icons/fi';

const NavigationWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Enhanced navigate function that scrolls to top
  const navigateWithScroll = (to, options = {}) => {
    // Close mobile menu when navigating
    closeMobileMenu();
    
    // Force scroll to top immediately before navigation
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Reset any scrollable containers
    const allScrollableElements = document.querySelectorAll('*');
    allScrollableElements.forEach(element => {
      if (element.scrollTop !== undefined) {
        element.scrollTop = 0;
      }
      if (element.style && element.style.position === 'fixed') {
        element.style.top = '0px';
      }
    });
    
    // Then navigate
    navigate(to, options);
    
    // Force scroll again after navigation completes
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Reset all scrollable elements again
      const allElementsAgain = document.querySelectorAll('*');
      allElementsAgain.forEach(element => {
        if (element.scrollTop !== undefined) {
          element.scrollTop = 0;
        }
        if (element.style && element.style.position === 'fixed') {
          element.style.top = '0px';
        }
      });
    }, 0);
    
    // Final scroll reset after a short delay
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  };

  // Override the global navigate function
  React.useEffect(() => {
    // Store original navigate if it exists
    const originalNavigate = window.navigate;
    
    // Override with our scroll-to-top version
    window.navigate = navigateWithScroll;
    
    return () => {
      // Restore original navigate on cleanup
      if (originalNavigate) {
        window.navigate = originalNavigate;
      }
    };
  }, [navigate]);

  // Force scroll to top on every location change
  React.useEffect(() => {
    const forceScrollToTop = () => {
      // Reset window scroll
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Reset all scrollable elements
      const scrollableElements = document.querySelectorAll('*');
      scrollableElements.forEach(element => {
        if (element.scrollTop !== undefined) {
          element.scrollTop = 0;
        }
        if (element.style && element.style.position === 'fixed') {
          element.style.top = '0px';
        }
      });
      
      // Specifically handle dashboard containers
      const dashboardElements = document.querySelectorAll('.dashboard-container, .main-content, .dashboard');
      dashboardElements.forEach(element => {
        if (element.scrollTop !== undefined) {
          element.scrollTop = 0;
        }
      });
    };

    // Execute immediately
    forceScrollToTop();
    
    // Execute multiple times to ensure it works
    setTimeout(forceScrollToTop, 0);
    setTimeout(forceScrollToTop, 50);
    setTimeout(forceScrollToTop, 100);
    setTimeout(forceScrollToTop, 200);
  }, [location.pathname]);

  // Make mobile menu functions available globally
  React.useEffect(() => {
    window.toggleMobileMenu = toggleMobileMenu;
    window.closeMobileMenu = closeMobileMenu;
    window.isMobileMenuOpen = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="sidebar-close" onClick={closeMobileMenu}>
            <FiX />
          </button>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-nav-item ${isActive('/')}`} onClick={closeMobileMenu}>
            <FiHome className="nav-icon" />
            <span>Home</span>
          </Link>
          <Link to="/learn-planting" className={`sidebar-nav-item ${isActive('/learn-planting')}`} onClick={closeMobileMenu}>
            <FiBook className="nav-icon" />
            <span>Learn Planting</span>
          </Link>
          <Link to="/about" className={`sidebar-nav-item ${isActive('/about')}`} onClick={closeMobileMenu}>
            <FiInfo className="nav-icon" />
            <span>About Us</span>
          </Link>
          <Link to="/contact" className={`sidebar-nav-item ${isActive('/contact')}`} onClick={closeMobileMenu}>
            <FiPhone className="nav-icon" />
            <span>Contact Us</span>
          </Link>
          <Link to="/login" className={`sidebar-nav-item login-item ${isActive('/login')}`} onClick={closeMobileMenu}>
            <FiLogIn className="nav-icon" />
            <span>Login</span>
          </Link>
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`mobile-sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} 
        onClick={closeMobileMenu}
      ></div>

      {/* Pass mobile menu props to children */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onMobileMenuToggle: toggleMobileMenu,
            isMobileMenuOpen: isMobileMenuOpen
          });
        }
        return child;
      })}
    </>
  );
};

export default NavigationWrapper;
