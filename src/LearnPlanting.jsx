import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaTimes, FaLock } from "react-icons/fa";
import './LearnPlanting.css';
import { FiBook, FiTarget, FiAward, FiClock, FiCheckCircle, FiPlayCircle } from 'react-icons/fi';
import Header from "./components/Header";

// Available courses list with their corresponding slugs for routing
const courses = [
  {
    id: 1,
    slug: 'cacao-basics',
    title: "Cacao Basics",
    description: "Learn the essential knowledge about cacao plants, varieties, and their requirements.",
    modules: [
      {
        id: 'module-1',
        title: 'Introduction to Cacao'
      },
      {
        id: 'module-2',
        title: 'Cacao Varieties'
      }
    ]
  },
  {
    id: 2,
    slug: 'planting-techniques',
    title: "Planting Techniques",
    description: "Master the best practices for planting cacao, soil preparation, and seedling care.",
    modules: [
      {
        id: 'module-3',
        title: 'Soil Preparation'
      },
      {
        id: 'module-4',
        title: 'Planting Methods'
      }
    ]
  },
  {
    id: 3,
    slug: 'harvest-processing',
    title: "Harvest & Processing",
    description: "Master the art of harvesting, fermenting, drying, and processing cacao beans for premium quality.",
    modules: [
      {
        id: 'module-10',
        title: 'Harvesting Techniques'
      },
      {
        id: 'module-11',
        title: 'Pod Breaking & Fermentation'
      },
      {
        id: 'module-12',
        title: 'Drying & Storage'
      },
      {
        id: 'module-13',
        title: 'Quality Control'
      }
    ]
  },
  {
    id: 4,
    slug: 'pest-management',
    title: "Pest & Disease Management",
    description: "Identify, prevent, and control common cacao pests and diseases to protect your farm.",
    comingSoon: true
  },
  {
    id: 5,
    slug: 'cloning-techniques',
    title: "Types of Cloning in Cacao",
    description: "Learn about different methods of cacao propagation including grafting, cuttings, and tissue culture.",
    modules: [
      {
        id: 'module-5',
        title: 'Introduction to Cacao Cloning'
      },
      {
        id: 'module-6',
        title: 'Grafting Techniques'
      },
      {
        id: 'module-7',
        title: 'Tissue Culture Methods'
      }
    ]
  },
  {
    id: 6,
    slug: 'care-management',
    title: "Care Management",
    description: "Essential practices for maintaining healthy cacao plants and maximizing yield.",
    modules: [
      {
        id: 'module-8',
        title: 'Irrigation and Water Management'
      },
      {
        id: 'module-9',
        title: 'Pruning and Canopy Management'
      },
      {
        id: 'module-10',
        title: 'Nutrient Management'
      }
    ]
  },
  {
    id: 7,
    slug: 'gap-practices',
    title: "GAP (Good Agricultural Practices)",
    description: "Learn and implement sustainable and responsible farming practices for cacao cultivation.",
    modules: [
      {
        id: 'module-11',
        title: 'Introduction to GAP'
      },
      {
        id: 'module-12',
        title: 'Sustainable Farming Methods'
      },
      {
        id: 'module-13',
        title: 'Quality Control and Certification'
      }
    ]
  }
];

function LearnPlanting() {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleCourseClick = (course, e) => {
    // Check if user is authenticated using the same token logic as App.jsx
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') ||
                  localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    
    if (!token) {
      e.preventDefault();
      // Show login modal instead of toast
      setShowLoginModal(true);
      return;
    }
    
    // If already authenticated, navigate to the first module of the selected course
    if (course.modules && course.modules.length > 0) {
      navigate(`/lessons/${course.slug}/${course.modules[0].id}`);
    } else {
      navigate(`/lessons/${course.slug}`);
    }
  };

  return (
    <div className="learn-planting-page">
      <Header />
      {/* Hero Section */}
      <section className="planting-hero">
        <div>
          <h1>Explore Our Courses</h1>
          <p>
            Choose a course below and start your journey to becoming a cacao farming expert.
          </p>
        </div>
      </section>

      {/* Courses Section */}
      <section className="planting-modules">
        <h2>Available Courses</h2>
        <p className="modules-intro">
          Select a course to begin learning practical skills for cacao farming.
        </p>
        <div className="modules-grid">
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="module-card"
              onClick={(e) => handleCourseClick(course, e)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <button 
                className="module-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCourseClick(course, e);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Objectives Section */}
      <section className="learning-objectives">
        <div className="container">
          <h2>What You'll Learn</h2>
          <p className="objectives-intro">
            Our comprehensive courses are designed to give you practical, hands-on knowledge for successful cacao farming.
          </p>
          <div className="objectives-grid">
            <div className="objective-card">
              <div className="objective-icon">🌱</div>
              <h3>Master Cacao Science</h3>
              <p>Understand cacao plant biology, growth cycles, and environmental requirements for optimal cultivation.</p>
            </div>
            <div className="objective-card">
              <div className="objective-icon">🔧</div>
              <h3>Practical Techniques</h3>
              <p>Learn proven planting methods, soil management, and farm maintenance strategies used by experts.</p>
            </div>
            <div className="objective-card">
              <div className="objective-icon">🛡️</div>
              <h3>Pest & Disease Control</h3>
              <p>Identify, prevent, and manage common cacao diseases and pests to protect your investment.</p>
            </div>
            <div className="objective-card">
              <div className="objective-icon">📈</div>
              <h3>Harvest Optimization</h3>
              <p>Maximize yield and quality through proper harvesting, processing, and post-harvest techniques.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Path Section */}
      <section className="learning-path">
        <div className="container">
          <h2>Your Learning Journey</h2>
          <p className="path-intro">
            Follow our structured learning path from beginner to expert cacao farmer.
          </p>
          <div className="path-steps">
            <div className="path-step">
              <div className="step-number">1</div>
              <h4>Foundation</h4>
              <p>Start with Cacao Basics to understand plant science and requirements.</p>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <div className="step-number">2</div>
              <h4>Planting</h4>
              <p>Master planting techniques, soil preparation, and early care methods.</p>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <div className="step-number">3</div>
              <h4>Management</h4>
              <p>Learn pest control, disease management, and ongoing farm maintenance.</p>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <div className="step-number">4</div>
              <h4>Harvest</h4>
              <p>Perfect your harvesting and processing techniques for maximum quality and yield.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="success-stories">
        <div className="container">
          <h2>Success Stories</h2>
          <p className="stories-intro">
            Hear from farmers who transformed their cacao operations with our courses.
          </p>
          <div className="stories-grid">
            <div className="story-card">
              <div className="story-quote">
                "Thanks to AgriLearn Cacao, I increased my harvest yield by 40% in just one season!"
              </div>
              <div className="story-author">
                <strong>Maria Rodriguez</strong>
                <span>Small-scale farmer, Philippines</span>
              </div>
            </div>
            <div className="story-card">
              <div className="story-quote">
                "The pest management techniques I learned saved my entire cacao plantation from disease."
              </div>
              <div className="story-author">
                <strong>James Chen</strong>
                <span>Commercial farmer, Malaysia</span>
              </div>
            </div>
            <div className="story-card">
              <div className="story-quote">
                "Professional certification helped me secure better prices for my premium cacao beans."
              </div>
              <div className="story-author">
                <strong>Ana Santos</strong>
                <span>Organic farmer, Brazil</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Do I need prior farming experience?</h4>
              <p>No! Our courses are designed for beginners and experienced farmers alike. We start with the basics and build up to advanced techniques.</p>
            </div>
            <div className="faq-item">
              <h4>How long does each course take?</h4>
              <p>Each course is designed to be completed in 2-4 weeks with 4-6 hours of study per week. You can learn at your own pace.</p>
            </div>
            <div className="faq-item">
              <h4>Are the courses available offline?</h4>
              <p>Yes! Download course materials for offline viewing. Perfect for farmers in areas with limited internet access.</p>
            </div>
            <div className="faq-item">
              <h4>What equipment do I need?</h4>
              <p>Most techniques can be implemented with basic farming tools. We'll recommend specific equipment where needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="planting-cta">
        <div className="container">
          <h2>Ready to Start Your Cacao Journey?</h2>
          <p>Join thousands of learners who are mastering the art of cacao cultivation with AgriLearn Cacao.</p>
          <button className="cta-button" onClick={() => {
            // Check if user is authenticated
            const isAuthenticated = localStorage.getItem('isAuthenticated');
            
            if (!isAuthenticated) {
              // Show login popup
              if (window.confirm('Please login first to access learning content.\n\nClick OK to go to login page.')) {
                // Store the intended URL to redirect after login
                localStorage.setItem('intendedUrl', window.location.pathname);
                navigate('/login');
              }
            } else {
              // User is authenticated, navigate to learning content
              navigate('/lessons/cacao-basics');
            }
          }}>Start Learning Today</button>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="about-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>AgriLearn Cacao</h4>
              <p>
                Empowering farmers with innovative e-learning solutions for sustainable cacao cultivation.
              </p>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Connect With Us</h4>
              <div className="social-links">
                <a href="#">Facebook</a>
                <a href="#">Twitter</a>
                <a href="#">Instagram</a>
                <a href="#">LinkedIn</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 AgriLearn Cacao. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay">
          <div className="login-modal">
            <div className="login-modal-header">
              <FaLock className="login-icon" />
              <h3>Login Required</h3>
            </div>
            <div className="login-modal-content">
              <p>Please log in to access this course content and start your learning journey.</p>
              <div className="login-modal-buttons">
                <button 
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowLoginModal(false)}
                >
                  Cancel
                </button>
                <Link 
                  to="/login" 
                  className="modal-btn modal-btn-login"
                  onClick={() => setShowLoginModal(false)}
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearnPlanting;
