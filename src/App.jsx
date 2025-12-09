import './App.css';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiMenu, FiX, FiHome, FiBook, FiInfo, FiPhone, FiLogIn } from 'react-icons/fi';
import ContactUs from './ContactUs';
import LearnPlanting from './LearnPlanting';
import LessonsPage from './LessonsPage';
import InteractiveQuiz from './GameQuizes/InteractiveQuiz';
import MemoryGame from './GameQuizes/MemoryGame';
import MatchingCardsGame from './GameQuizes/MatchingCardsGame';
import CacaoProcessingGame from './GameQuizes/CacaoProcessingGame';
import AboutUs from './AboutUs';
import Login from './Login';
import Signup from './Signup';
import VerifyEmail from './VerifyEmail';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './pages/Dashboard';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/adminDashboard';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import PestDiseaseGame from './GameQuizes/PestDiseaseGame';
import CloningTypesGame from './GameQuizes/CloningTypesGames';
import CareManagementGame from './GameQuizes/CareManagementGame';
import GAPScrambleGame from './GameQuizes/GAPScrambleGame';
import ScrollToTop from './components/ScrollToTop';
import NavigationWrapper from './components/NavigationWrapper';

// Rest of your App.jsx file...

function MainContent({ onMobileMenuToggle, isMobileMenuOpen }) {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') ||
                  localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

    if (!token) {
      // Show notification if not logged in
      toast.warning('Please log in first to access the courses.', {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      // User is logged in, navigate to learn-planting
      navigate('/learn-planting');
    }
  };

  return (
    <div className="elearning-landing">
      {/* Header Section */}
      <Header onMobileMenuToggle={onMobileMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Welcome to AgriLearn Cacao</h2>
            <p>
              Your journey to mastering cacao cultivation starts here. Explore our expert-led courses,
              track your progress, and join a thriving community of cacao growers.
            </p>
            <button className="cta-button" onClick={handleGetStarted}>Get Started</button>
          </div>
          <div className="hero-visual">
            <div className="design-image">
              <img
                src="/CacaoLogo.png"
                alt="AgriLearn Cacao System"
                style={{
                  width: "100%",
                  height: "auto",
                  boxShadow: "0 4px 16px rgba(30,58,46,0.10)"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cacao Gallery Section */}
      <section className="cacao-gallery">
        <div className="container">
          <div className="section-header">
            <h2>Discover the World of Cacao</h2>
            <p>Explore the journey from bean to bar through our visual story</p>
          </div>

          <div className="gallery-grid">
            <div className="gallery-item large">
              <div className="gallery-image">
                <img src="/CacaoFarm.png" alt="Cacao Farm" />
                <div className="gallery-overlay">
                  <h3>Sustainable Cacao Farming</h3>
                  <p>Discover how cacao is grown in harmony with nature</p>
                </div>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <img src="/CacaoPods.png" alt="Cacao Pods" />
                <div className="gallery-overlay">
                  <h3>Harvesting</h3>
                  <p>Learn about the perfect time to harvest cacao pods</p>
                </div>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <img src="/CacaoBeans.png" alt="Cacao Beans" />
                <div className="gallery-overlay">
                  <h3>Fermentation</h3>
                  <p>The crucial process that develops cacao's rich flavors</p>
                </div>
              </div>
            </div>

            <div className="gallery-item">
              <div className="gallery-image">
                <img src="/CacaoChocolateMaking.png" alt="Cacao Chocolate Making" />
                <div className="gallery-overlay">
                  <h3>Chocolate Production</h3>
                  <p>From bean to bar: the chocolate making process</p>
                </div>
              </div>
            </div>

            <div className="gallery-item large">
              <div className="gallery-image">
                <img src="/CacaoProducts.png" alt="Cacao Products" />
                <div className="gallery-overlay">
                  <h3>Diverse Products</h3>
                  <p>Explore the many products derived from cacao</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cacao Benefits & Story Section */}
      <section className="cacao-benefits-story">
        <div className="container">
          <div className="section-header">
            <h2>The Cacao Story & Benefits</h2>
            <p>
              Discover the rich history, incredible health benefits, and sustainable future of cacao cultivation
            </p>
          </div>

          <div className="benefits-content">
            {/* Story Timeline */}
            <div className="story-timeline">
              <div className="timeline-item">
                <div className="timeline-content">
                  <img src="/AncientOrigin.png" alt="Ancient Cacao Use" className="timeline-image" />
                  <h3>Ancient Origins</h3>
                  <p>For over 3,000 years, cacao has been treasured by ancient civilizations as the "food of the gods."</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-content">
                  <img src="/CacaoJourney.png" alt="Cacao Trade" className="timeline-image" />
                  <h3>Global Journey</h3>
                  <p>From Mesoamerica to the world, cacao became a global phenomenon, transforming cultures and economies.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-content">
                  <img src="/CacaoModernFarming.png" alt="Modern Cacao Farming" className="timeline-image" />
                  <h3>Modern Cultivation</h3>
                  <p>Today, sustainable cacao farming supports millions of smallholder farmers across the tropics.</p>
                </div>
              </div>
            </div>

            {/* Benefits Showcase */}
            <div className="benefits-showcase">
              {/* Health Benefits Card */}
              <div className="benefit-card health">
                <div className="card-image">
                  <img src="/HealthCacao.png" alt="Health Benefits of Cacao" />
                </div>
                <div className="card-content">
                  <h3>Health & Wellness</h3>
                  <p>Packed with antioxidants, flavonoids, and essential minerals that support heart health, brain function, and overall well-being.</p>
                </div>
              </div>

              {/* Economic Impact Card */}
              <div className="benefit-card economic">
                <div className="card-image">
                  <img src="/EconomicCacao.png" alt="Economic Impact of Cacao" />
                </div>
                <div className="card-content">
                  <h3>Economic Impact</h3>
                  <p>Creating sustainable livelihoods for millions of smallholder farmers and their communities worldwide.</p>
                </div>
              </div>

              {/* Environmental Card */}
              <div className="benefit-card environmental">
                <div className="card-image">
                  <img src="/EnvironmentalCacao.png" alt="Environmental Impact of Cacao" />
                </div>
                <div className="card-content">
                  <h3>Environmental Stewardship</h3>
                  <p>Promoting biodiversity and sustainable land use through responsible cacao cultivation practices.</p>
                </div>
              </div>

              {/* Cultural Heritage Card */}
              <div className="benefit-card cultural">
                <div className="card-image">
                  <img src="/CulturalCacao.png" alt="Cultural Heritage of Cacao" />
                </div>
                <div className="card-content">
                  <h3>Cultural Heritage</h3>
                  <p>Preserving ancient traditions and knowledge passed down through generations of cacao farmers.</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="cta-section">
              <h3>Join the Cacao Revolution</h3>
              <p>Discover how you can be part of sustainable cacao farming and enjoy its many benefits.</p>
              <p>Our mission is to preserve this rich heritage while advancing modern, sustainable farming practices that benefit both farmers and the environment.</p>

              <div className="cacao-quote-card">
                <div className="quote-icon">"</div>
                <p className="quote-text">
                  Cacao is more than just the source of chocolate - it's a sacred gift from nature, a bridge between cultures, and a symbol of life's sweetness that has been cherished for millennia.
                </p>
                <div className="quote-author">- Ancient Mayan Proverb</div>
              </div>

              <Link to="/learn-planting" className="cta-button">Learn More</Link>
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

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green color theme
    },
    secondary: {
      main: '#558b2f', // Darker green
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
  },
});

function App() {
  // Force scroll to top on route change
  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Reset all scrollable elements
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        if (element.scrollTop !== undefined) {
          element.scrollTop = 0;
        }
      });
    };

    resetScroll();
    setTimeout(resetScroll, 0);
    setTimeout(resetScroll, 50);
    setTimeout(resetScroll, 100);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <NavigationWrapper>
          <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/learn-planting" element={<LearnPlanting />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/courses/:courseId/lessons" element={<LessonsPage />} />
          <Route path="/courses/:courseId/lessons/:moduleId" element={<LessonsPage />} />
          <Route path="/courses/:courseId/lessons/:moduleId/:lessonId" element={<LessonsPage />} />
          
          {/* Game Routes */}
          <Route path="/games">
            <Route index element={<Navigate to="/" replace />} />
            <Route path="quiz" element={<InteractiveQuiz />} />
            <Route path="quiz/:lessonId" element={<InteractiveQuiz />} />
            <Route path="memory" element={<MemoryGame />} />
            <Route path="memory/:lessonId" element={<MemoryGame />} />
            <Route path="matching-quiz" element={<MatchingCardsGame />} />
            <Route path="matching-quiz/:moduleId" element={<MatchingCardsGame />} />
            <Route path="cacao-processing" element={<CacaoProcessingGame />} />
            <Route path="pest-disease" element={<PestDiseaseGame />} />
            <Route path="cloning-types" element={<CloningTypesGame />} />
            <Route path="care-management" element={<CareManagementGame />} />
            <Route path="gap-scramble" element={<GAPScrambleGame />} />
          </Route>
          
          <Route path="/login" element={
            (() => {
              const userToken = localStorage.getItem('token') || sessionStorage.getItem('token');
              const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
              
              if (userToken) {
                return <Navigate to="/dashboard" />;
              }
              if (adminToken) {
                return <Navigate to="/admin/dashboard" />;
              }
              return <Login />;
            })()
          } />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard/*"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          
          {/* Redirect old gap-practices quiz URL to the new route */}
          <Route 
            path="/lessons/gap-practices/gap-practices/quiz" 
            element={<Navigate to="/games/gap-scramble" replace />} 
          />
          
          {/* Catch-all route for any other unmatched paths */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
        </NavigationWrapper>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </ThemeProvider>
  );
}

export default App
