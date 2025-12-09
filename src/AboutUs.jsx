import { Link } from 'react-router-dom';
import './AboutUs.css';
import ContactUs from './ContactUs';
import LearnPlanting from './LearnPlanting';
import Header from './components/Header';

function AboutUs() {
  return (
    <div className="about-page">
      <Header />

      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h2>About AgriLearn Cacao</h2>
          <p>Learn cacao farming online with simple, practical courses designed for everyone.</p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="mission-vision">
        <div className="container">
          <div className="mission-card">
            
            <h3>Our Mission</h3>
            <p>Making cacao farming education accessible to everyone through simple, practical online courses.</p>
          </div>
          
          <div className="vision-card">
    
            <h3>Our Vision</h3>
            <p>To be the leading platform for cacao education, supporting sustainable farming worldwide.</p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="our-story">
        <div className="container">
          <div className="story-content">
            <div className="story-text">
              <h3>Our Story</h3>
              <p>AgriLearn Cacao started with a simple goal: help farmers learn cacao farming online. We saw that many farmers needed better access to practical knowledge, so we created easy-to-follow courses that combine traditional wisdom with modern techniques.</p>
              
              <p>Today, thousands of learners trust our platform to learn cacao farming, from beginners to experienced growers.</p>
            </div>
            <div className="story-image">
              <img src="/CacaoChocolateMaking.png" alt="Cacao Chocolate Making" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <h3>Core Values</h3>
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"></path>
                </svg>
              </div>
              <div className="value-content">
                <h4>Sustainability</h4>
                <p>Eco-friendly farming practices</p>
              </div>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <div className="value-content">
                <h4>Education</h4>
                <p>Accessible quality learning</p>
              </div>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                </svg>
              </div>
              <div className="value-content">
                <h4>Community</h4>
                <p>Supportive farmer network</p>
              </div>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                </svg>
              </div>
              <div className="value-content">
                <h4>Innovation</h4>
                <p>Modern farming technology</p>
              </div>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <div className="value-content">
                <h4>Excellence</h4>
                <p>High-quality education</p>
              </div>
            </div>
            
            <div className="value-item">
              <div className="value-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                </svg>
              </div>
              <div className="value-content">
                <h4>Global Impact</h4>
                <p>Worldwide farmer support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <h3>Meet Our Team</h3>
          <p className="team-subtitle">Passionate experts dedicated to transforming cacao education</p>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-photo">
                <img src="/Kristofer.png" alt="Dr. Maria Santos" />
                <div className="member-overlay">
                  <div className="member-socials">
                    <a href="#" aria-label="LinkedIn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                    <a href="#" aria-label="Twitter">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              <h4>Krisofer John Sarmiento</h4>
              <p className="member-role">Web Developer</p>
              <p className="member-bio">10+ years in tropical agriculture, leading educational content with scientific precision.</p>
            </div>
            
            <div className="team-member">
              <div className="member-photo">
                <img src="/Nesleah.png" alt="Nesleah"/>
                <div className="member-overlay">
                  <div className="member-socials">
                    <a href="#" aria-label="LinkedIn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                    <a href="#" aria-label="Twitter">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              <h4>Nesleah Angel</h4>
              <p className="member-role">Web Developer</p>
              <p className="member-bio">E-learning platform innovator creating seamless, engaging educational experiences.</p>
            </div>
            
            <div className="team-member">
              <div className="member-photo">
                <img src="/Glydel.png" alt="Ana Chen" />
                <div className="member-overlay">
                  <div className="member-socials">
                    <a href="#" aria-label="LinkedIn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                    <a href="#" aria-label="Twitter">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              <h4>Glydel Reymundo</h4>
              <p className="member-role">Web Developer</p>
              <p className="member-bio">Building global learner communities and fostering peer-to-peer knowledge sharing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="container">
          <h3>Our Impact</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">2,500+</div>
              <div className="stat-label">Active Learners</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">15+</div>
              <div className="stat-label">Countries Reached</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Course Completion Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Certificates Issued</div>
            </div>
          </div>
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
                <li><Link to="/learn-planting">Learning Planting</Link></li>
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
    </div>
  )
}

export default AboutUs
