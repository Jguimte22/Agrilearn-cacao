import React, { useState, useEffect, Component } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { fetchCourses as fetchCoursesFromAPI, fetchUserActivity, getBadgeViews, updateBadgeViews } from '../services/api';
import { progressAPI, achievementAPI, notificationAPI, progressUtils } from '../services/progressAPI';
import certificateAPI from '../services/certificateAPI';
import quizScoreAPI from '../services/quizScoreAPI';
import OTPDisplay from '../components/OTPDisplay';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

import 'react-toastify/dist/ReactToastify.css';
import {
  FiHome,
  FiBookOpen,
  FiBook,
  FiAward,
  FiLogOut,
  FiUser,
  FiChevronDown,
  FiX,
  FiCheck,
  FiEdit2,
  FiSave,
  FiArrowLeft,
  FiMenu,
  FiBarChart2,
  FiTrendingUp,
  FiStar,
  FiTarget,
  FiZap,
  FiHeart,
  FiGift,
  FiSun,
  FiMoon,
  FiClock,
  FiCalendar,
  FiHash,
  FiEye,
  FiDownload,
  FiShare2,
  FiCheckCircle,
  FiShield,
  FiLock,
  FiChevronRight,
  FiMail,
  FiUpload,
  FiRotateCcw,
  FiRotateCw,
  FiRefreshCw,
  FiMapPin,
  FiBell,
  FiSettings,
  FiSearch,
  FiCamera,
  FiPhone
} from 'react-icons/fi';
import './Dashboard.css';

// Map icon names to icon components
const iconMap = {
  FiBook, FiAward, FiHeart, FiTarget, FiStar, FiZap, FiTrendingUp,
  FiGift, FiSun, FiMoon, FiCheckCircle, FiClock, FiCalendar, FiBarChart2
};

// Helper function to get icon component from string name
const getIconComponent = (iconName) => {
  if (!iconName) return <FiAward />; // Default icon component
  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent /> : <FiAward />; // Return component or default
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top when component mounts or location changes
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Also scroll any scrollable containers
      const scrollableElements = document.querySelectorAll('.dashboard-container, main, .main-content');
      scrollableElements.forEach(element => {
        if (element.scrollTop !== undefined) {
          element.scrollTop = 0;
        }
      });
    };

    scrollToTop();

    // Double-check after a short delay
    const timeoutId = setTimeout(scrollToTop, 50);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Helper function to check if a course is new (only for admin-added courses with createdAt timestamp)
  const isNewCourse = (course) => {
    // Only show NEW badge for courses that have a createdAt timestamp (admin-added courses)
    if (!course.createdAt) return false;

    const createdDate = new Date(course.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    return diffDays <= 3; // Courses created in the last 3 days are considered new
  };

  // Helper function to get correct image path
  const getImagePath = (imageName, courseTitle = null) => {
    console.log('Dashboard getImagePath called with:', imageName, 'course title:', courseTitle);

    // Check if it's already a full HTTP URL
    if (imageName.startsWith('http')) {
      console.log('Image is already a full URL:', imageName);
      return imageName;
    }

    // Check if it's an uploaded image (starts with /images/courses/)
    if (imageName.startsWith('/images/courses/')) {
      console.log('Image is an uploaded file:', imageName);
      return imageName;
    }

    // Custom image mapping for specific courses based on course title
    const customImageMap = {
      'Cacao Basics': '/CacaoBacics.png',
      'Planting Techniques': '/PlantingBg.png',
      'Harvest & Processing': '/CacaoHarvest.png',
      'Pest & Disease Management': '/PestDisease.png',
      'Types of Cloning in Cacao': '/Cloning.png',
      'Care Management': '/CareManagement.png',
      'GAP (Good Agricultural Practices)': '/GAP.png'
    };

    // Check if we have a custom mapping for this course title
    if (courseTitle && customImageMap[courseTitle]) {
      console.log('Using custom mapping for course title:', courseTitle, '->', customImageMap[courseTitle]);
      return customImageMap[courseTitle];
    }

    // If it already starts with /, use it as-is (database now has leading slashes)
    if (imageName.startsWith('/')) {
      console.log('Image already has leading slash:', imageName);
      return imageName;
    }

    // Otherwise add leading slash
    const finalPath = '/' + imageName;
    console.log('Added leading slash:', finalPath);
    return finalPath;
  };

  // Helper function to get auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('Auth token retrieval:', {
      localStorageToken: !!localStorage.getItem('token'),
      sessionStorageToken: !!sessionStorage.getItem('token'),
      hasToken: !!token,
      tokenLength: token?.length,
      currentUser: currentUser?.name
    });
    return token;
  };

  // Initialize user state with data from localStorage or sessionStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const userFromLocal = localStorage.getItem('user');
    const userFromSession = sessionStorage.getItem('user');

    const parseUserData = (userData) => {
      try {
        if (!userData) return null;
        const user = JSON.parse(userData);
        console.log('DEBUG: Raw user data from localStorage:', user);
        console.log('DEBUG: Raw birthdate from user data:', user.birthdate);
        return {
          _id: user._id,
          name: user.fullName || 'Guest User',
          firstName: user.firstName || '',
          surname: user.surname || '',
          email: user.email || '',
          contactNumber: user.contactNumber || '',
          address: user.address || '',
          birthdate: user.birthdate ? new Date(user.birthdate) : '',
          age: user.age || '',
          gender: user.gender || '',
          userRole: user.userRole || 'Farmer',
          role: user.role || 'Farmer',
          joinDate: user.createdAt || new Date().toISOString(),
          bio: user.bio || 'Add a bio to tell people more about yourself',
          location: user.address || ''
        };
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    };

    const user = parseUserData(userFromLocal) || parseUserData(userFromSession);

    return user || {
      name: 'Guest User',
      email: '',
      contactNumber: '',
      address: '',
      age: '',
      gender: '',
      joinDate: new Date().toISOString(),
      bio: 'Add a bio to tell people more about yourself',
      location: '',
      role: 'Farmer'
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlipH, setImageFlipH] = useState(false);
  const [imageFlipV, setImageFlipV] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...currentUser });

  // Facebook-style crop states
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = React.useRef(null);
  const [courseCatalog, setCourseCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle tab changes with browser history
  const handleTabChange = (tab) => {
    // Update the active tab
    setActiveTab(tab);

    // Update browser URL without page reload
    const newUrl = `/dashboard?tab=${tab}`;
    window.history.pushState({ tab }, '', newUrl);

    // Close sidebar on mobile when tab is selected
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        // Handle initial load or back to dashboard without state
        const urlParams = new URLSearchParams(window.location.search);
        const tabFromUrl = urlParams.get('tab');
        if (tabFromUrl) {
          setActiveTab(tabFromUrl);
        } else {
          setActiveTab('dashboard');
        }
      }
    };

    // Check for tab in URL on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl && ['dashboard', 'statistics', 'scores', 'notifications', 'certificates', 'achievements', 'profile', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper function to get first name
  const getFirstName = (fullName) => {
    if (!fullName || fullName === 'Guest User' || fullName === 'User') {
      return fullName;
    }
    return fullName.split(' ')[0];
  };
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [userActivity, setUserActivity] = useState({
    coursesInProgress: 0,
    completedLessons: 0,
    achievementsUnlocked: 0,
    timeSpentThisWeek: 0,
    timeSpentTotal: 0,
    timeTrend: 0,
    categoryBreakdown: []
  });

  // Real progress data states
  const [courseProgress, setCourseProgress] = useState([]);
  const [realStats, setRealStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    averageProgress: 0,
    totalLessons: 0
  });
  const [userNotifications, setUserNotifications] = useState(() => {
    // On initial load, clean up any notifications with "undefined" from localStorage
    try {
      const stored = localStorage.getItem('userNotifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        const cleaned = parsed.filter(n =>
          !n.title?.includes('undefined') &&
          !n.message?.includes('undefined')
        );

        if (cleaned.length !== parsed.length) {
          console.log(`🧹 Cleaned ${parsed.length - cleaned.length} notifications with "undefined" from localStorage`);
          localStorage.setItem('userNotifications', JSON.stringify(cleaned));
        }

        return cleaned;
      }
    } catch (e) {
      console.error('Error cleaning localStorage notifications:', e);
    }
    return [];
  });
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [isFetchingNotifications, setIsFetchingNotifications] = useState(false);
  // Don't load from localStorage on initial state to prevent glitching
  // Let the API fetch populate the notifications instead
  // Custom setter for userNotifications that also saves to localStorage
  const setUserNotificationsWithStorage = (notifications) => {
    setUserNotifications(notifications);
    localStorage.setItem('userNotifications', JSON.stringify(notifications));
  };
  const [userCertificates, setUserCertificates] = useState([]);
  const [userAchievements, setUserAchievements] = useState({
    unlocked: [],
    locked: [],
    totalUnlocked: 0,
    totalAvailable: 0
  });
  const [newAchievementsCount, setNewAchievementsCount] = useState(0);
  const [progressLoading, setProgressLoading] = useState(false);

  // Achievements data - will be fetched from API
  const [achievements, setAchievements] = useState([]);

  // Quiz scores state
  const [quizScores, setQuizScores] = useState([]);
  const [quizScoresLoading, setQuizScoresLoading] = useState(false);
  const [quizStats, setQuizStats] = useState({
    totalQuizzesTaken: 0,
    averageScore: 0,
    bestScore: 0,
    totalAttempts: 0
  });

  // Calculate unread notifications count
  const unreadNotificationsCount = userNotifications ? userNotifications.filter(n => !n.read).length : 0;

  // Debug notification badge state
  console.log('🔔 Notification Badge Check:', {
    totalNotifications: userNotifications?.length || 0,
    unreadCount: unreadNotificationsCount,
    notificationsLoading,
    shouldShowBadge: !notificationsLoading && unreadNotificationsCount > 0,
    currentUser: currentUser?.name
  });

  // Calculate total quiz scores count (for badge display)
  const [showQuizScoresBadge, setShowQuizScoresBadge] = useState(false);
  const quizScoresCount = quizScores ? quizScores.length : 0;

  // Badge state for Achievements
  const [showAchievementsBadge, setShowAchievementsBadge] = useState(false);

  // Badge state for Certificates
  const [showCertificatesBadge, setShowCertificatesBadge] = useState(false);

  // Badge state for Statistics
  const [showStatisticsBadge, setShowStatisticsBadge] = useState(false);

  // Badge views from database (replaces localStorage)
  const [badgeViews, setBadgeViews] = useState({
    lastAchievementCount: 0,
    lastQuizScoreCount: 0,
    lastCertificateCount: 0,
    lastNotificationCount: 0
  });
  const [badgeViewsLoaded, setBadgeViewsLoaded] = useState(false);

  // Show badge when new quiz scores are added (using database)
  useEffect(() => {
    // Don't show badges until badgeViews are loaded from database
    if (!badgeViewsLoaded) return;

    if (activeTab !== 'scores') {
      // Show badge ONLY if:
      // 1. There ARE quiz scores (count > 0)
      // 2. AND count is MORE than last viewed count
      if (quizScoresCount > 0 && quizScoresCount > badgeViews.lastQuizScoreCount) {
        setShowQuizScoresBadge(true);
        console.log('📊 Quiz Scores badge shown:', { quizScoresCount, lastViewed: badgeViews.lastQuizScoreCount });
      } else {
        setShowQuizScoresBadge(false);
        console.log('📊 Quiz Scores badge hidden:', { quizScoresCount, lastViewed: badgeViews.lastQuizScoreCount });
      }
    }
  }, [quizScoresCount, activeTab, badgeViews.lastQuizScoreCount, badgeViewsLoaded]);

  // Show badge when new achievements are unlocked (using database)
  useEffect(() => {
    // Don't show badges until badgeViews are loaded from database
    if (!badgeViewsLoaded) return;

    if (activeTab !== 'achievements') {
      const achievementsCount = userAchievements.unlocked ? userAchievements.unlocked.length : 0;

      console.log('🏆 Achievement Badge Check:', {
        achievementsCount,
        lastAchievementCount: badgeViews.lastAchievementCount,
        shouldShow: achievementsCount > 0 && achievementsCount > badgeViews.lastAchievementCount,
        badgeViewsLoaded,
        activeTab
      });

      // Show badge ONLY if there ARE achievements AND count is MORE than last viewed
      if (achievementsCount > 0 && achievementsCount > badgeViews.lastAchievementCount) {
        console.log('🏆 Showing achievement badge');
        setShowAchievementsBadge(true);
      } else {
        setShowAchievementsBadge(false);
      }
    }
  }, [userAchievements.unlocked?.length, activeTab, badgeViews.lastAchievementCount, badgeViewsLoaded]);

  // Show badge when certificates are available (using database)
  useEffect(() => {
    // Don't show badges until badgeViews are loaded from database AND certificates are loaded
    if (!badgeViewsLoaded || !userCertificates) return;

    if (activeTab !== 'certificates') {
      const certificatesCount = userCertificates ? userCertificates.length : 0;

      // Show badge ONLY if there ARE certificates AND count is MORE than last viewed
      if (certificatesCount > 0 && certificatesCount > badgeViews.lastCertificateCount) {
        setShowCertificatesBadge(true);
      } else {
        setShowCertificatesBadge(false);
      }
    }
  }, [activeTab, badgeViews.lastCertificateCount, badgeViewsLoaded, userCertificates]); // Added userCertificates to ensure it's loaded

  // Show badge when there's new activity for Statistics (using database)
  useEffect(() => {
    // Don't show badges until badgeViews are loaded from database
    if (!badgeViewsLoaded) return;

    if (activeTab !== 'statistics') {
      const achievementsCount = userAchievements.unlocked ? userAchievements.unlocked.length : 0;

      // Show badge ONLY for new achievements, NOT for quiz game completion
      const hasNewAchievements = achievementsCount > 0 && achievementsCount > badgeViews.lastAchievementCount;

      // Removed quiz scores from Statistics badge - quiz completion should not trigger Statistics badge
      if (hasNewAchievements) {
        console.log('📊 Statistics Badge: Showing for new achievements only (quiz game completion excluded)');
        setShowStatisticsBadge(true);
      } else {
        setShowStatisticsBadge(false);
      }
    }
  }, [activeTab, badgeViews.lastAchievementCount, badgeViewsLoaded]); // Removed userAchievements.unlocked?.length to prevent auto-hiding

  // Hide badge and update database when user views Quiz Scores tab
  useEffect(() => {
    if (activeTab === 'scores' && showQuizScoresBadge) {
      const timeout = setTimeout(async () => {
        setShowQuizScoresBadge(false);
        // Update database with current count
        try {
          await updateBadgeViews({
            ...badgeViews,
            lastQuizScoreCount: quizScoresCount
          });
          setBadgeViews(prev => ({ ...prev, lastQuizScoreCount: quizScoresCount }));
        } catch (error) {
          console.error('Error updating badge views:', error);
        }
      }, 2000); // Reduced from 10 seconds to 2 seconds

      return () => clearTimeout(timeout);
    }
  }, [activeTab, showQuizScoresBadge]); // Removed quizScoresCount to prevent race conditions

  // Hide badge and update database when user views Achievements tab
  useEffect(() => {
    if (activeTab === 'achievements' && showAchievementsBadge) {
      const timeout = setTimeout(async () => {
        setShowAchievementsBadge(false);
        const achievementsCount = userAchievements.unlocked ? userAchievements.unlocked.length : 0;
        // Update database with current count
        try {
          await updateBadgeViews({
            ...badgeViews,
            lastAchievementCount: achievementsCount
          });
          setBadgeViews(prev => ({ ...prev, lastAchievementCount: achievementsCount }));
        } catch (error) {
          console.error('Error updating badge views:', error);
        }
      }, 2000); // Reduced from 10 seconds to 2 seconds

      return () => clearTimeout(timeout);
    }
  }, [activeTab, showAchievementsBadge]); // Removed userAchievements.unlocked?.length to prevent race conditions

  // Hide badge and update database when user views Certificates tab
  useEffect(() => {
    if (activeTab === 'certificates' && showCertificatesBadge) {
      const timeout = setTimeout(async () => {
        setShowCertificatesBadge(false);
        const certificatesCount = userCertificates ? userCertificates.length : 0;
        // Update database with current count
        try {
          await updateBadgeViews({
            ...badgeViews,
            lastCertificateCount: certificatesCount
          });
          setBadgeViews(prev => ({ ...prev, lastCertificateCount: certificatesCount }));
        } catch (error) {
          console.error('Error updating badge views:', error);
        }
      }, 2000); // Reduced from 10 seconds to 2 seconds

      return () => clearTimeout(timeout);
    }
  }, [activeTab, showCertificatesBadge]); // Removed userCertificates?.length to prevent race conditions

  // Hide badge and update database when user views Statistics tab
  useEffect(() => {
    if (activeTab === 'statistics' && showStatisticsBadge) {
      const timeout = setTimeout(async () => {
        setShowStatisticsBadge(false);
        const achievementsCount = userAchievements.unlocked ? userAchievements.unlocked.length : 0;

        // Update database with achievements count only (quiz scores excluded)
        try {
          await updateBadgeViews({
            ...badgeViews,
            lastAchievementCount: achievementsCount
            // Removed lastQuizScoreCount - quiz completion should not affect Statistics badge
          });
          setBadgeViews(prev => ({
            ...prev,
            lastAchievementCount: achievementsCount
            // Removed lastQuizScoreCount - quiz completion should not affect Statistics badge
          }));
          console.log('📊 Statistics Badge: Updated achievements count (quiz scores excluded)');
        } catch (error) {
          console.error('Error updating badge views:', error);
        }
      }, 5000); // Wait 5 seconds when user clicks Statistics tab

      return () => clearTimeout(timeout);
    }
  }, [activeTab, showStatisticsBadge]); // Removed userAchievements.unlocked?.length and quizScoresCount to prevent race conditions

  // Settings state
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      emailNotifications: true,
      pushNotifications: true,
      courseUpdates: true,
      theme: 'light'
    };
  });

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP verification state
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [pendingPasswordChange, setPendingPasswordChange] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  // Privacy and Security state
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const [selectedPrivacyOption, setSelectedPrivacyOption] = useState(null);

  // Manual achievement check for testing
  const checkAndUnlockAchievements = async () => {
    try {
      console.log('🔍 Checking user achievements...');

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      // Check the raw API response
      const response = await fetch('http://localhost:5000/api/achievements/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Raw API response:', result);
        console.log('📊 Unlocked array:', result.unlocked);
        console.log('📊 Unlocked length:', result.unlocked?.length);
        console.log('📊 Total unlocked:', result.totalUnlocked);

        // Check each unlocked achievement
        if (result.unlocked && result.unlocked.length > 0) {
          result.unlocked.forEach((ua, index) => {
            console.log(`🏆 Achievement ${index + 1}:`, ua);
            console.log(`🏆 Achievement ID:`, ua.achievementId?._id);
            console.log(`🏆 Achievement Name:`, ua.achievementId?.name);
          });
        }

        // Refresh the display
        await fetchAchievementsFromAPI();

        alert(`📊 Achievement Check Complete!\n\nAPI shows: ${result.unlocked?.length || 0} unlocked\nDisplay shows: ${userAchievements.unlocked?.length || 0} unlocked\n\nCheck console for details.`);
      } else {
        console.error('❌ Failed to get achievements:', response.status);
        alert('Failed to get achievements');
      }

    } catch (error) {
      console.error('❌ Error checking achievements:', error);
      alert('Error checking achievements');
    }
  };

  // Fetch achievements from backend API
  const fetchAchievementsFromAPI = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token || !currentUser || currentUser.name === 'Guest User') {
        console.log('fetchAchievementsFromAPI - Skipping: No token or guest user');
        return;
      }

      console.log('fetchAchievementsFromAPI - Making API call...');

      // First, check and unlock any new achievements based on user progress
      try {
        console.log('fetchAchievementsFromAPI - Checking progress for new achievements...');
        await achievementAPI.checkProgress();
        console.log('fetchAchievementsFromAPI - Progress check complete');
      } catch (checkError) {
        console.error('fetchAchievementsFromAPI - Progress check failed:', checkError);
        // Continue anyway to fetch existing achievements
      }

      // Try the API call with error handling
      let response;
      try {
        response = await achievementAPI.getUserAchievements();
      } catch (apiError) {
        console.error('fetchAchievementsFromAPI - API call failed:', apiError);
        console.error('fetchAchievementsFromAPI - API error details:', apiError.response?.data);

        // Set empty achievements as fallback
        setUserAchievements({
          unlocked: [],
          locked: [],
          totalUnlocked: 0,
          totalAvailable: 0
        });
        return;
      }

      console.log('fetchAchievementsFromAPI - API response:', response);
      console.log('fetchAchievementsFromAPI - Response type:', typeof response);
      console.log('fetchAchievementsFromAPI - Response keys:', Object.keys(response || {}));

      // Check if response is valid
      if (!response || typeof response !== 'object') {
        console.error('fetchAchievementsFromAPI - Invalid response:', response);
        setUserAchievements({
          unlocked: [],
          locked: [],
          totalUnlocked: 0,
          totalAvailable: 0
        });
        return;
      }

      // Extract data from the correct structure
      const unlocked = response.unlocked || [];
      const locked = response.locked || [];
      const totalUnlocked = response.totalUnlocked || 0;
      const totalAvailable = response.totalAvailable || 0;

      console.log('fetchAchievementsFromAPI - Unlocked achievements:', unlocked);
      console.log('fetchAchievementsFromAPI - Unlocked count:', unlocked.length);
      console.log('fetchAchievementsFromAPI - Total unlocked:', totalUnlocked);

      // Update userAchievements state - keep the API structure as-is
      const userAchievementsData = {
        unlocked: unlocked, // Keep original structure with achievementId populated
        locked: locked,     // Keep original structure
        totalUnlocked: unlocked.length,
        totalAvailable
      };

      console.log('fetchAchievementsFromAPI - Setting userAchievements:', userAchievementsData);
      console.log('fetchAchievementsFromAPI - Unlocked achievements:', unlocked);
      unlocked.forEach(ua => {
        console.log('  ✅', ua.achievementId?.name, '- ID:', ua.achievementId?._id);
      });

      setUserAchievements(userAchievementsData);

      // Don't create local notifications - backend creates them via check-progress endpoint
      const seenAchievements = JSON.parse(localStorage.getItem('seenAchievements') || '[]');
      const seenAchievementIds = new Set(seenAchievements);

      // Find new achievements (unlocked but not seen)
      const newAchievements = unlocked.filter(ua => !seenAchievementIds.has(ua.achievementId._id));

      console.log('fetchAchievementsFromAPI - New achievements:', newAchievements.length);

      if (newAchievements.length > 0) {
        setNewAchievementsCount(newAchievements.length);

        // Don't create notifications here - the backend already creates them
        // Just update seen achievements
        const updatedSeenAchievements = [...seenAchievements, ...newAchievements.map(ua => ua.achievementId._id)];
        localStorage.setItem('seenAchievements', JSON.stringify(updatedSeenAchievements));

        // Fetch latest notifications from backend (they were created by check-progress endpoint)
        await fetchNotificationsFromAPI();
      }

    } catch (error) {
      console.error('fetchAchievementsFromAPI - Error fetching achievements from API:', error);
    }
  };

  // Fetch notifications from backend API
  const fetchNotificationsFromAPI = async () => {
    // Prevent concurrent calls
    if (isFetchingNotifications) {
      console.log('fetchNotificationsFromAPI - Already fetching, skipping...');
      return;
    }

    try {
      setIsFetchingNotifications(true);
      setNotificationsLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('fetchNotificationsFromAPI - Token check:', {
        hasToken: !!token,
        currentUser: currentUser?.name,
        isGuest: currentUser?.name === 'Guest User'
      });

      if (!token || !currentUser || currentUser.name === 'Guest User') {
        console.log('fetchNotificationsFromAPI - Skipping: No token or guest user');
        setNotificationsLoading(false);
        setIsFetchingNotifications(false);
        return;
      }

      console.log('fetchNotificationsFromAPI - Making API call...');

      // Always fetch from API to get the latest notifications
      const response = await notificationAPI.getNotifications();
      console.log('fetchNotificationsFromAPI - API response:', response);
      console.log('fetchNotificationsFromAPI - Response data:', response.data);
      console.log('fetchNotificationsFromAPI - Response notifications:', response.notifications);
      console.log('fetchNotificationsFromAPI - Response data notifications:', response.data?.notifications);

      // Handle both response structures (direct and wrapped in data)
      const apiNotifications = response.notifications || response.data?.notifications || response.data || [];
      console.log('fetchNotificationsFromAPI - API notifications count:', apiNotifications.length);

      // Transform API notifications to frontend format and filter out any with "undefined"
      const transformedNotifications = apiNotifications
        .map(notification => ({
          id: notification._id || notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          time: formatNotificationTime(notification.createdAt),
          read: notification.isRead || notification.read,
          icon: notification.icon || 'bell',
          actionUrl: notification.actionUrl,
          actionText: notification.actionText
        }))
        .filter(notification => {
          // Filter out notifications with "undefined" in title or message
          const hasUndefined =
            (notification.title && notification.title.includes('undefined')) ||
            (notification.message && notification.message.includes('undefined'));

          if (hasUndefined) {
            console.log('⚠️ Filtering out notification with undefined:', notification);
          }

          return !hasUndefined;
        });

      console.log('fetchNotificationsFromAPI - Transformed notifications:', transformedNotifications);

      // Always set notifications from API (even if empty, to clear old ones)
      // For new users with no notifications, set empty array instead of default notifications
      if (transformedNotifications.length === 0) {
        // Clear notifications for new users - don't show fake/default notifications
        setUserNotifications([]);
        localStorage.setItem('userNotifications', JSON.stringify([])); // Clear localStorage as well
        console.log('fetchNotificationsFromAPI - No notifications from API, cleared notifications');
      } else {
        setUserNotifications(transformedNotifications);
        localStorage.setItem('userNotifications', JSON.stringify(transformedNotifications)); // Save to localStorage
        console.log('fetchNotificationsFromAPI - Set notifications from API:', transformedNotifications.length);
      }
    } catch (error) {
      console.error('fetchNotificationsFromAPI - Error fetching notifications from API:', error);
      console.error('fetchNotificationsFromAPI - Error details:', error.response?.data);
    } finally {
      setNotificationsLoading(false);
      setIsFetchingNotifications(false);
    }
  };

  // Helper function to format notification time
  const formatNotificationTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return created.toLocaleDateString();
  };

  // Clean up localStorage certificates on mount (one-time cleanup)
  useEffect(() => {
    const cleanupKey = 'certificates_cleaned_v1';
    if (!localStorage.getItem(cleanupKey)) {
      // Remove old fake certificates from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('userCertificates')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      localStorage.setItem(cleanupKey, 'true');
      console.log('✅ Cleaned up old certificate data from localStorage');
    }
  }, []);

  // Fetch badge views from database on component mount
  useEffect(() => {
    const fetchBadgeViewsFromDB = async () => {
      if (currentUser && currentUser.name !== 'Guest User') {
        try {
          const views = await getBadgeViews();
          setBadgeViews(views);
          setBadgeViewsLoaded(true);
          console.log('✅ Loaded badge views from database:', views);
        } catch (error) {
          console.error('Error fetching badge views:', error);
          // If error, keep default state (all 0) and mark as loaded
          setBadgeViewsLoaded(true);
        }
      } else {
        // For guest users, mark as loaded immediately
        setBadgeViewsLoaded(true);
      }
    };

    fetchBadgeViewsFromDB();
  }, [currentUser]);

  // Auto-refresh notifications, achievements, and certificates every 30 seconds
  useEffect(() => {
    if (currentUser && currentUser.name !== 'Guest User') {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing notifications, achievements, and certificates...');
        fetchNotificationsFromAPI();
        fetchAchievementsFromAPI();
        fetchCertificatesFromAPI();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'notifications' && currentUser && currentUser.name !== 'Guest User') {
      fetchNotificationsFromAPI();
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (activeTab === 'achievements' && currentUser && currentUser.name !== 'Guest User') {
      fetchAchievementsFromAPI();
    }
  }, [activeTab, currentUser]);

  // Fetch certificates when certificates tab is activated or on component mount
  useEffect(() => {
    if (currentUser && currentUser.name !== 'Guest User') {
      fetchCertificatesFromAPI();
    }
  }, [currentUser]); // This handles component mount

  useEffect(() => {
    if (activeTab === 'certificates' && currentUser && currentUser.name !== 'Guest User') {
      fetchCertificatesFromAPI();
    }
  }, [activeTab, currentUser]); // This handles tab activation

  // Fetch quiz scores when scores tab is activated
  useEffect(() => {
    if (activeTab === 'scores' && currentUser && currentUser.name !== 'Guest User') {
      fetchQuizScoresFromAPI();
    }
  }, [activeTab, currentUser]);

  // Fetch quiz scores on component mount
  useEffect(() => {
    if (currentUser && currentUser.name !== 'Guest User') {
      fetchQuizScoresFromAPI();
    }
  }, [currentUser]);

  // Add course completion notification
  const addCourseCompletionNotification = (courseTitle) => {
    // Fetch fresh notifications from API (backend creates the notification)
    fetchNotificationsFromAPI();

    // Show toast notification
    toast.success(`Congratulations! You completed ${courseTitle}!`, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  // Get user-specific localStorage key
  const getUserStorageKey = (baseKey) => {
    const userEmail = currentUser?.email || currentUser?.name || 'guest';
    return `${baseKey}_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  };

  // Fetch certificates from backend API
  const fetchCertificatesFromAPI = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token || !currentUser || currentUser.name === 'Guest User') {
        console.log('fetchCertificatesFromAPI - Skipping: No token or guest user');
        setUserCertificates([]);
        return;
      }

      console.log('fetchCertificatesFromAPI - Making API call to MongoDB...');

      // Use the certificateAPI service for consistency
      const response = await certificateAPI.getCertificates();
      console.log('fetchCertificatesFromAPI - CertificateAPI response:', response);

      if (response.success && response.certificates && response.certificates.length > 0) {
        // Make sure all certificates have required fields with defaults
        const validCertificates = response.certificates.map(cert => ({
          ...cert,
          category: cert.category || 'beginner',
          title: cert.title || cert.courseTitle || 'Course Certificate',
          description: cert.description || `Successfully completed ${cert.courseTitle || 'the course'}`,
          score: cert.score || cert.finalScore || 95,
          verificationCode: cert.verificationCode || cert.certificateId
        }));

        setUserCertificates(validCertificates);
        console.log('fetchCertificatesFromAPI - Loaded certificates:', validCertificates.length);

        // Force certificate badge to show if new certificates are found
        if (validCertificates.length > 0 && activeTab !== 'certificates') {
          const certificatesCount = validCertificates.length;
          if (certificatesCount > badgeViews.lastCertificateCount) {
            console.log('fetchCertificatesFromAPI - New certificates detected, showing badge');
            setShowCertificatesBadge(true);
          }
        }
      } else {
        // Try to create certificates for completed courses if none exist
        console.log('fetchCertificatesFromAPI - No certificates found, trying to create for completed courses...');
        try {
          const createResult = await certificateAPI.createForCompleted();
          console.log('fetchCertificatesFromAPI - Certificate creation result:', createResult);

          // Fetch certificates again after creation
          if (createResult.success && createResult.count > 0) {
            console.log('fetchCertificatesFromAPI - Created new certificates, fetching again...');
            setTimeout(() => fetchCertificatesFromAPI(), 1000);
          }
        } catch (createError) {
          console.log('fetchCertificatesFromAPI - Could not create certificates:', createError.message);
        }

        setUserCertificates([]);
        console.log('fetchCertificatesFromAPI - No certificates found, using empty array');
      }

    } catch (error) {
      console.error('fetchCertificatesFromAPI - Error fetching certificates:', error);

      // Try to create certificates as fallback
      try {
        console.log('fetchCertificatesFromAPI - Trying fallback certificate creation...');
        const createResult = await certificateAPI.createForCompleted();
        if (createResult.success && createResult.count > 0) {
          console.log('fetchCertificatesFromAPI - Fallback creation successful, fetching again...');
          setTimeout(() => fetchCertificatesFromAPI(), 1000);
        }
      } catch (fallbackError) {
        console.error('fetchCertificatesFromAPI - Fallback creation also failed:', fallbackError);
      }

      setUserCertificates([]);
    }
  };

  // Fetch quiz scores from backend API
  const fetchQuizScoresFromAPI = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token || !currentUser || currentUser.name === 'Guest User') {
        console.log('fetchQuizScoresFromAPI - Skipping: No token or guest user');
        setQuizScores([]);
        return;
      }

      console.log('fetchQuizScoresFromAPI - Fetching quiz scores...');
      setQuizScoresLoading(true);

      // Fetch user's quiz scores
      const scores = await quizScoreAPI.getMyScores();
      console.log('fetchQuizScoresFromAPI - Quiz scores fetched:', scores);
      setQuizScores(scores || []);

      // Fetch quiz statistics
      const stats = await quizScoreAPI.getStats();
      console.log('fetchQuizScoresFromAPI - Quiz stats fetched:', stats);
      setQuizStats({
        totalQuizzesTaken: stats?.totalQuizzesTaken || 0,
        averageScore: stats?.averageScore || 0,
        bestScore: stats?.bestScore || 0,
        totalAttempts: stats?.totalAttempts || 0
      });

    } catch (error) {
      console.error('fetchQuizScoresFromAPI - Error fetching quiz scores:', error);
      setQuizScores([]);
    } finally {
      setQuizScoresLoading(false);
    }
  };

  // State declarations and other functions will follow...

  // Component continues with proper structure...

  // Rest of component would be here...

  // Make notification function globally available
  useEffect(() => {
    window.addCourseCompletionNotification = addCourseCompletionNotification;
    return () => {
      delete window.addCourseCompletionNotification;
    };
  }, [addCourseCompletionNotification]);


  // Check for completed courses and add notifications, certificates, and achievements (only once)
  useEffect(() => {
    console.log('🔍 Course completion check triggered');
    console.log('🔍 courseProgress:', courseProgress);
    console.log('🔍 courseCatalog:', courseCatalog);

    if (courseProgress && courseProgress.length > 0 && courseCatalog && courseCatalog.length > 0) {
      // Get already completed courses from localStorage
      const completedNotifications = JSON.parse(localStorage.getItem('completedNotifications') || '[]');
      console.log('🔍 Already completed courses:', completedNotifications);

      courseProgress.forEach(courseProg => {
        console.log(`🔍 Checking course: ${courseProg.courseId}`, courseProg);

        // Enhanced completion detection with multiple fallback methods
        const course = courseCatalog.find(c => c.id === courseProg.courseId);
        if (course) {
          const totalLessons = course.lessons?.length || 0;
          const completedLessons = courseProg.completedLessons?.length || 0;
          const lessonBasedCompletion = completedLessons >= totalLessons && totalLessons > 0;

          // Fallback to course catalog progress
          const catalogProgress = course.progress || 0;
          const progressBasedCompletion = catalogProgress >= 100;

          // Fallback to API progress data
          const apiProgress = courseProg.overallProgress || 0;
          const apiBasedCompletion = apiProgress >= 100;

          // Use the most reliable method
          const isCompleted = lessonBasedCompletion || progressBasedCompletion || apiBasedCompletion;

          console.log(`🔍 Course completion check for ${course.title}:`, {
            totalLessons,
            completedLessons,
            lessonBasedCompletion,
            catalogProgress,
            progressBasedCompletion,
            apiProgress,
            apiBasedCompletion,
            isCompleted,
            alreadyNotified: completedNotifications.includes(course.id)
          });

          if (isCompleted && !completedNotifications.includes(course.id)) {
            console.log(`🎓 Course completed: ${course.title} - Triggering all systems`);

            // 1. Add course completion notification
            addCourseCompletionNotification(course.title);

            // 2. Certificates are now created automatically by the backend when course is completed
            // Refresh certificates from backend
            fetchCertificatesFromAPI();

            // 3. Refresh quiz scores to update badge count
            fetchQuizScoresFromAPI();

            // 4. Refresh achievements from backend API
            fetchAchievementsFromAPI();

            // 5. Check and create achievements
            setTimeout(() => {
              const updatedAchievements = generateUserAchievements();
              setAchievements(updatedAchievements);

              // Find new achievements that were just unlocked
              const newUnlockedAchievements = updatedAchievements.filter(a => a.unlocked && !achievements.find(prev => prev.id === a.id && prev.unlocked));

              if (newUnlockedAchievements.length > 0) {
                console.log(`🏆 New achievements unlocked: ${newUnlockedAchievements.length}`);
                setNewAchievementsCount(prev => prev + newUnlockedAchievements.length);

                // Create achievement notifications in backend
                newUnlockedAchievements.forEach(async (achievement) => {
                  try {
                    await notificationAPI.createNotification({
                      type: 'achievement',
                      title: 'Achievement Unlocked!',
                      message: `Congratulations! You've unlocked the "${achievement.title}" achievement.`,
                      icon: 'award'
                    });
                    console.log(`✅ Created backend notification for achievement: ${achievement.title}`);
                  } catch (error) {
                    console.error('Error creating achievement notification:', error);
                  }
                });

                // Refresh notifications from API to show the new achievement notifications
                setTimeout(() => {
                  fetchNotificationsFromAPI();
                }, 500);
              }

              // Store in localStorage to prevent duplicate notifications on page refresh
              completedNotifications.push(course.id);
              localStorage.setItem('completedNotifications', JSON.stringify(completedNotifications));
              console.log('🔍 Updated completed courses:', completedNotifications);
            }, 1000);
          }
        }
      });
    } else {
      console.log('🔍 Course completion check skipped - missing data');
    }
  }, [courseProgress, courseCatalog]);

  // Fetch real progress data
  const fetchProgressData = async () => {
    console.log('fetchProgressData called with currentUser:', currentUser);
    console.log('Course catalog length:', courseCatalog ? courseCatalog.length : 'undefined');

    if (!currentUser || currentUser.name === 'Guest User') {
      console.log('User not logged in, skipping progress data fetch');
      return;
    }

    // Check if user has authentication token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('Token check:', {
      localStorageToken: !!localStorage.getItem('token'),
      sessionStorageToken: !!sessionStorage.getItem('token'),
      token: !!token
    });

    if (!token) {
      console.log('No authentication token found, skipping progress data fetch');
      return;
    }

    // Wait for courses to load before fetching progress
    if (!courseCatalog || courseCatalog.length === 0) {
      console.log('Course catalog not loaded yet, skipping progress fetch');
      return;
    }

    try {
      setProgressLoading(true);

      // Get progress for each course with localStorage fallback
      const courseProgressPromises = courseCatalog.map(async (course) => {
        try {
          console.log(`Fetching progress for course: ${course.id}`);

          // Try to get progress from API first
          let response;
          try {
            response = await progressAPI.getProgress(course.id);
            console.log(`Progress response for ${course.id}:`, response);
          } catch (apiError) {
            console.log(`API failed for ${course.id}, trying localStorage fallback:`, apiError.message);

            // Fallback to localStorage when API fails
            const userStorageKey = getUserStorageKey(`courseProgress_${course.id}`);
            const localProgress = localStorage.getItem(userStorageKey);

            if (localProgress) {
              response = JSON.parse(localProgress);
              console.log(`Using localStorage progress for ${course.id}:`, response);
            } else {
              throw apiError; // Re-throw if no localStorage data
            }
          }

          // Save progress to localStorage for future fallbacks
          if (response) {
            const userStorageKey = getUserStorageKey(`courseProgress_${course.id}`);
            localStorage.setItem(userStorageKey, JSON.stringify(response));
          }

          return { courseId: course.id, ...response };
        } catch (error) {
          console.error(`Error fetching progress for ${course.id}:`, error);

          // Return empty progress but preserve any localStorage data
          const userStorageKey = getUserStorageKey(`courseProgress_${course.id}`);
          const localProgress = localStorage.getItem(userStorageKey);

          if (localProgress) {
            const parsedProgress = JSON.parse(localProgress);
            console.log(`Using localStorage fallback for ${course.id}:`, parsedProgress);
            return { courseId: course.id, ...parsedProgress };
          }

          return { courseId: course.id, overallProgress: 0, completedLessons: [] };
        }
      });

      const allCourseProgress = await Promise.all(courseProgressPromises);
      console.log('All course progress:', allCourseProgress);
      setCourseProgress(allCourseProgress);

      // Check if any course was completed and fetch achievements
      const completedCourses = allCourseProgress.filter(cp => cp.overallProgress >= 100);
      if (completedCourses.length > 0) {
        console.log('Courses completed:', completedCourses.map(cp => cp.courseId));
        // Only call fetchAchievementsFromAPI - it will handle checking progress,
        // creating notifications in backend, and fetching them
        await fetchAchievementsFromAPI(); // Check for new achievements when courses are completed
      }

      // Calculate total completed lessons across all courses
      const totalCompletedLessons = allCourseProgress.reduce(
        (total, course) => total + (course.completedLessons?.length || 0),
        0
      );

      // Get stats data
      const statsData = await progressAPI.getStats();
      console.log('📊 Stats data from API:', statsData);
      console.log('📊 Average progress:', statsData.averageProgress);

      setStats({
        totalCourses: courseCatalog.length || 0,
        completedCourses: completedCourses.length || 0,
        inProgressCourses: allCourseProgress.filter(cp => cp.overallProgress > 0 && cp.overallProgress < 100).length || 0,
        averageScore: statsData.averageScore || 0,
        totalTimeSpent: statsData.totalTimeSpent || 0,
        averageProgress: statsData.averageProgress || 0,
        totalLessons: totalCompletedLessons,
        timeTrend: 0,
        categoryBreakdown: [] // Would need additional calculation
      });

      // Calculate actual completion percentage based on completed courses
      const actualCompletionPercentage = courseCatalog.length > 0
        ? Math.round((completedCourses.length / courseCatalog.length) * 100)
        : 0;

      // Set real stats for learning progress with all calculated data
      const updatedRealStats = {
        ...statsData,
        totalLessons: totalCompletedLessons,
        totalCourses: courseCatalog.length || 0,
        completedCourses: completedCourses.length || 0,
        inProgressCourses: allCourseProgress.filter(cp => cp.overallProgress > 0 && cp.overallProgress < 100).length || 0,
        averageProgress: actualCompletionPercentage // Use actual completion percentage instead of API average
      };
      console.log('📊 Updated real stats:', updatedRealStats);
      setRealStats(updatedRealStats);

      // Get achievements data - use generated achievements based on user progress
      const generatedAchievements = generateUserAchievements();
      setAchievements(generatedAchievements);

      const achievementsData = {
        totalUnlocked: generatedAchievements.filter(a => a.unlocked).length
      };

      // Update user activity with real data
      setUserActivity({
        coursesInProgress: statsData.inProgressCourses || 0,
        completedLessons: totalCompletedLessons,
        achievementsUnlocked: achievementsData.totalUnlocked || 0,
        timeSpentThisWeek: 0, // Would need separate API for weekly data
        timeSpentTotal: statsData.totalTimeSpent || 0,
        timeTrend: 0,
        categoryBreakdown: [] // Would need additional calculation
      });

    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setProgressLoading(false);
    }
  };

  // Manual progress recalculation function
  const handleRecalculateProgress = async () => {
    if (!currentUser || currentUser.name === 'Guest User') {
      alert('Please log in to recalculate progress');
      return;
    }

    try {
      setProgressLoading(true);
      console.log('Manually triggering progress recalculation...');

      // Call the recalculate progress API
      const response = await progressAPI.recalculateProgress();
      console.log('Progress recalculation response:', response);

      // Force refresh all progress data from scratch
      console.log('Refreshing all progress data...');

      // Clear existing progress data to force fresh fetch
      setCourseProgress([]);
      setRealStats({
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        averageProgress: 0,
        totalLessons: 0
      });

      // Wait a moment for cache to clear
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh progress data after recalculation
      await fetchProgressData();

      // Also fetch fresh stats directly
      const freshStats = await progressAPI.getStats();
      console.log('Fresh stats from API:', freshStats);

      // Calculate actual completion percentage based on completed courses
      const actualCompletionPercentage = freshStats.totalCourses > 0
        ? Math.round((freshStats.completedCourses / freshStats.totalCourses) * 100)
        : 0;

      // Update real stats with correct completion percentage
      const correctedStats = {
        ...freshStats,
        averageProgress: actualCompletionPercentage
      };

      setRealStats(correctedStats);

      alert(`✅ Progress recalculated successfully! \n\nActual completion: ${actualCompletionPercentage}% (${freshStats.completedCourses}/${freshStats.totalCourses} courses)\n\nRefreshing page to ensure all updates are applied...`);

      // Force page refresh to clear any remaining cache
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error recalculating progress:', error);
      alert('❌ Error recalculating progress. Please try again.');
    } finally {
      setProgressLoading(false);
    }
  };

  // Save user profile function
  const handleSaveUserProfile = async () => {
    if (!currentUser || currentUser.name === 'Guest User') {
      alert('Please log in to save profile');
      return;
    }

    try {
      setSettingsLoading(true);
      console.log('Saving user profile...');

      // Add your profile saving logic here
      // For now, just show a success message
      alert('✅ Profile saved successfully!');

    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error saving profile. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Discard changes function
  const handleDiscardChanges = () => {
    if (!currentUser || currentUser.name === 'Guest User') {
      alert('Please log in to discard changes');
      return;
    }

    try {
      console.log('Discarding profile changes...');

      // Add your discard logic here - reset form fields, etc.
      // For now, just show a confirmation message
      alert('✅ Changes discarded!');

    } catch (error) {
      console.error('Error discarding changes:', error);
      alert('❌ Error discarding changes. Please try again.');
    }
  };

  // Handle setting changes
  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Save settings function
  const handleSaveSettings = async () => {
    if (!currentUser || currentUser.name === 'Guest User') {
      alert('Please log in to save settings');
      return;
    }

    try {
      setSettingsLoading(true);
      console.log('Saving settings...');

      // Add your settings saving logic here
      // For now, just show a success message
      alert('✅ Settings saved successfully!');

    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Error saving settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setPasswordLoading(true);
      console.log('Initiating password change...');

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        setPasswordError('No authentication token found. Please log in again.');
        return;
      }

      // Step 1: Send OTP for password change confirmation
      const response = await fetch('http://localhost:5000/api/users/send-password-change-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store pending password change data
        setPendingPasswordChange({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });

        // Show OTP verification form
        setShowOTPVerification(true);
        setOtpSent(true);
        setOtpResendTimer(60); // 60 seconds countdown

        // Start countdown timer
        const timer = setInterval(() => {
          setOtpResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast.success('OTP sent to your email! Please check your inbox.', {
          position: 'top-right',
          autoClose: 5000
        });
      } else {
        setPasswordError(data.message || 'Failed to send OTP. Please try again.');
      }

    } catch (error) {
      console.error('Error initiating password change:', error);
      setPasswordError('An error occurred while initiating password change. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess(false);

    // Validate OTP
    const otpValue = otpCode.join('');
    if (otpValue.length !== 6) {
      setOtpError('Please enter all 6 digits of the OTP');
      return;
    }

    try {
      setOtpLoading(true);
      console.log('Verifying OTP for password change...');

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token || !pendingPasswordChange) {
        setOtpError('Session expired. Please try again.');
        return;
      }

      // Verify OTP and change password
      const response = await fetch('http://localhost:5000/api/users/verify-otp-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          otp: otpValue,
          currentPassword: pendingPasswordChange.currentPassword,
          newPassword: pendingPasswordChange.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpSuccess(true);
        setPasswordSuccess(true);

        // Reset all forms
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setOtpCode(['', '', '', '', '', '']);
        setPendingPasswordChange(null);

        // Hide OTP form after success
        setTimeout(() => {
          setShowOTPVerification(false);
          setOtpSuccess(false);
          setPasswordSuccess(false);
        }, 3000);

        toast.success('Password changed successfully!', {
          position: 'top-right',
          autoClose: 5000
        });
      } else {
        setOtpError(data.message || 'Invalid OTP. Please try again.');
      }

    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError('An error occurred while verifying OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    if (otpResendTimer > 0) return;

    try {
      setOtpLoading(true);
      setOtpError('');

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        setOtpError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/resend-password-change-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpResendTimer(60); // Reset timer

        // Start countdown timer
        const timer = setInterval(() => {
          setOtpResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast.success('OTP resent to your email!', {
          position: 'top-right',
          autoClose: 5000
        });
      } else {
        setOtpError(data.message || 'Failed to resend OTP. Please try again.');
      }

    } catch (error) {
      console.error('Error resending OTP:', error);
      setOtpError('An error occurred while resending OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP input change
  const handleOTPChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle OTP key press
  const handleOTPKeyPress = (e, index) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Cancel password change
  const cancelPasswordChange = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess(false);
    setShowOTPVerification(false);
    setOtpCode(['', '', '', '', '', '']);
    setOtpError('');
    setOtpSuccess(false);
    setPendingPasswordChange(null);
    setOtpSent(false);
    setOtpResendTimer(0);
  };

  // Debug: Log realStats whenever it changes
  useEffect(() => {
    console.log('🔍 realStats updated:', realStats);
  }, [realStats]);

  // Fetch real progress data on component mount and when user changes or courses load
  useEffect(() => {
    fetchProgressData();
  }, [currentUser, courseCatalog]);

  // Fetch user activity data - using mock data directly
  useEffect(() => {
    // Use mock activity data to avoid API calls
    const mockActivityData = {
      coursesInProgress: 0,
      completedLessons: 0,
      achievementsUnlocked: 0,
      timeSpentThisWeek: 0,
      timeSpentTotal: 0,
      timeTrend: 0,
      categoryBreakdown: []
    };

    setUserActivity(mockActivityData);
  }, []);

  // Show welcome notification on component mount if user is logged in
  useEffect(() => {
    // Debug: Check what's in storage
    console.log('=== Dashboard Mount - Authentication Debug ===');
    console.log('Storage debug:', {
      localStorageUser: localStorage.getItem('user'),
      localStorageToken: localStorage.getItem('token'),
      sessionStorageUser: sessionStorage.getItem('user'),
      sessionStorageToken: sessionStorage.getItem('token'),
      currentUser: currentUser
    });

    // Check authentication status
    const token = getAuthToken();
    console.log('Initial auth check:', {
      hasToken: !!token,
      isLoggedIn: currentUser?.name !== 'Guest User',
      userName: currentUser?.name,
      userEmail: currentUser?.email
    });

    // Check if we've shown the welcome notification in this session
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome') === 'true';
    const showWelcome = sessionStorage.getItem('showWelcomeNotification') === 'true';

    if (currentUser && currentUser.name !== 'Guest User' && (showWelcome || !hasSeenWelcome)) {
      console.log('Showing welcome notification for user:', currentUser.name);

      // Show the welcome message
      toast.success(`Welcome back, ${getFirstName(currentUser.name)}!`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        toastId: 'welcome-notification' // This prevents duplicate toasts
      });

      // Mark as seen in session storage
      sessionStorage.setItem('hasSeenWelcome', 'true');
      sessionStorage.removeItem('showWelcomeNotification');
    }

    // Debug logs for user data
    console.log('Current user data:', currentUser);
    console.log('LocalStorage user:', localStorage.getItem('user'));
    console.log('SessionStorage user:', sessionStorage.getItem('user'));
  }, [currentUser]);
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        setCurrentUser(prev => ({ ...prev, ...userData }));

        // Fetch courses from the API
        setCatalogLoading(true);
        const courses = await fetchCourses();
        setCourseCatalog(courses);
        setCatalogError(null);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setCatalogError('Failed to load courses. Please try again later.');
      } finally {
        setCatalogLoading(false);
      }
    };

    loadInitialData();
  }, []);
  // Handle storage events for user data updates
  useEffect(() => {
    const handleStorageChange = () => {
      const userFromLocal = localStorage.getItem('user');
      const userFromSession = sessionStorage.getItem('user');
      const userData = userFromLocal ? JSON.parse(userFromLocal) :
        userFromSession ? JSON.parse(userFromSession) : null;

      if (userData) {
        setCurrentUser(prev => ({
          ...prev,
          ...userData,
          courses: userData.courses || []
        }));
      }
    };

    // Listen for storage events (in case of login in another tab)
    window.addEventListener('storage', handleStorageChange);

    // Also check immediately in case we missed the storage event
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Stats data
  const [stats, setStats] = useState({
    totalCourses: 0,
    inProgress: 0,
    completed: 0,
    averageScore: 0,
    totalScore: 0
  });

  // Update achievements when progress changes
  useEffect(() => {
    if ((courseProgress && courseProgress.length > 0) || (stats && stats.totalScore > 0) || (courseCatalog && courseCatalog.length > 0)) {
      const updatedAchievements = generateUserAchievements();
      setAchievements(updatedAchievements);
    }
  }, [courseProgress, stats, courseCatalog]);

  // Notifications data - will be fetched from API
  // Note: userNotifications is already declared above at line 156

  const markAsRead = async (id) => {
    // Try to update in backend first if it's an API notification
    if (typeof id === 'string' && id.length === 24) { // MongoDB ObjectId length
      try {
        await notificationAPI.markAsRead(id);
        // Update local state immediately instead of full refresh to avoid affecting other badges
        const updatedNotifications = userNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        );
        setUserNotificationsWithStorage(updatedNotifications);
      } catch (error) {
        console.error('Error marking notification as read in backend:', error);
        // Fallback: update local state if API fails
        const updatedNotifications = userNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        );
        setUserNotificationsWithStorage(updatedNotifications);
      }
    } else {
      // Local notification update
      const updatedNotifications = userNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      setUserNotificationsWithStorage(updatedNotifications);
    }

    console.log('markAsRead - Marked notification as read:', id);
  };

  const markAllAsRead = async () => {
    console.log('🔔 markAllAsRead called');
    console.log('🔔 Current notifications:', userNotifications);
    console.log('🔔 Unread count before:', unreadNotificationsCount);

    try {
      // Call backend API to mark all as read
      await notificationAPI.markAllAsRead();
      console.log('🔔 Backend API called successfully');

      // Update local state immediately instead of full refresh to avoid affecting other badges
      const updatedNotifications = userNotifications.map(notification => ({
        ...notification,
        read: true
      }));
      console.log('🔔 Updated notifications locally:', updatedNotifications);
      setUserNotificationsWithStorage(updatedNotifications);
    } catch (error) {
      console.error('🔔 Error marking all notifications as read:', error);

      // Fallback to local state update if API fails
      const updatedNotifications = userNotifications.map(notification => ({
        ...notification,
        read: true
      }));
      console.log('🔔 Updated notifications locally:', updatedNotifications);
      setUserNotificationsWithStorage(updatedNotifications);
    }

    console.log('markAllAsRead - Marked all notifications as read');
  };

  const deleteNotification = async (id) => {
    // Try to delete from backend first if it's an API notification
    if (typeof id === 'string' && id.length === 24) { // MongoDB ObjectId length
      try {
        await notificationAPI.deleteNotification(id);
        // Refresh notifications from API after deletion
        await fetchNotificationsFromAPI();
      } catch (error) {
        // If 404, the notification doesn't exist in backend (might be old localStorage data)
        // Just remove it from local state
        if (error.response?.status === 404) {
          console.log('Notification not found in backend, removing from local state:', id);
          const updatedNotifications = userNotifications.filter(notification => notification.id !== id);
          setUserNotifications(updatedNotifications);
          localStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
        } else {
          console.error('Error deleting notification from backend:', error);
        }
      }
    } else {
      // Update local state for non-API notifications
      const updatedNotifications = userNotifications.filter(notification => notification.id !== id);
      setUserNotifications(updatedNotifications);
      localStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
    }

    console.log('deleteNotification - Deleted notification:', id);
  };

  // Add manual course completion trigger for testing
  const triggerManualCourseCompletion = () => {
    console.log('🧪 Manual course completion trigger');

    // Find first 3 courses and mark them as completed
    if (courseCatalog && courseCatalog.length >= 3) {
      const coursesToComplete = courseCatalog.slice(0, 3);

      coursesToComplete.forEach((course, index) => {
        setTimeout(() => {
          console.log(`🧪 Manually completing course: ${course.title}`);

          // 1. Add course completion notification
          addCourseCompletionNotification(course.title);

          // 2. Certificates are now created automatically by the backend
          // Refresh certificates from backend
          fetchCertificatesFromAPI();

          // 3. Check and create achievements
          setTimeout(() => {
            const updatedAchievements = generateUserAchievements();
            setAchievements(updatedAchievements);

            const newUnlockedAchievements = updatedAchievements.filter(a => a.unlocked && !achievements.find(prev => prev.id === a.id && prev.unlocked));

            if (newUnlockedAchievements.length > 0) {
              setNewAchievementsCount(prev => prev + newUnlockedAchievements.length);

              newUnlockedAchievements.forEach(achievement => {
                const notification = {
                  id: `achievement-${achievement.id}-${Date.now()}`,
                  type: 'achievement_unlocked',
                  title: 'Achievement Unlocked!',
                  message: `Congratulations! You've unlocked the "${achievement.title}" achievement.`,
                  time: 'Just now',
                  read: false,
                  icon: 'award'
                };
                setUserNotifications(prev => [notification, ...prev]);
              });
            }
          }, 500);

        }, index * 1000); // Stagger the completions
      });
    }
  };

  // Test Statistics badge functionality (quiz game completion excluded)
  const triggerStatisticsBadgeTest = () => {
    console.log('🧪 Testing Statistics badge functionality (quiz game completion excluded)...');

    // Simulate new quiz score (should NOT trigger Statistics badge)
    const testQuizScore = {
      id: 'test-quiz-' + Date.now(),
      quizTitle: 'Test Quiz Game',
      score: 95,
      totalQuestions: 10,
      correctAnswers: 9,
      timeSpent: 120,
      date: new Date().toISOString()
    };

    // Add test quiz score to existing quiz scores
    setQuizScores(prev => [testQuizScore, ...prev]);

    // Simulate new achievement (should trigger Statistics badge)
    const testAchievement = {
      id: 'test-achievement-' + Date.now(),
      title: 'Test Achievement for Statistics',
      description: 'This is a test achievement to verify Statistics badge works correctly.',
      icon: '📊',
      unlocked: true,
      progress: 100,
      target: 1,
      current: 1,
      date: new Date().toISOString()
    };

    // Add test achievement to existing achievements
    setUserAchievements(prev => ({
      ...prev,
      unlocked: [...(prev.unlocked || []), testAchievement],
      totalUnlocked: (prev.totalUnlocked || 0) + 1
    }));

    console.log('🧪 Statistics badge test completed:');
    console.log('   - Quiz score added (should NOT trigger Statistics badge)');
    console.log('   - Achievement added (should trigger Statistics badge)');
    console.log('🧪 Check Statistics tab - badge should only appear for achievements!');
  };

  // Test notification badge functionality
  const triggerNotificationBadgeTest = () => {
    console.log('🧪 Testing notification badge functionality...');

    // Simulate new notification to test the badge
    const testNotification = {
      id: 'test-notification-' + Date.now(),
      type: 'test',
      title: '🧪 Test Notification',
      message: 'This is a test notification to verify badge functionality.',
      time: 'Just now',
      read: false,
      actionUrl: '/dashboard?tab=notifications',
      actionText: 'View Notification'
    };

    // Add test notification to existing notifications
    setUserNotifications(prev => [testNotification, ...prev]);

    console.log('🧪 Notification badge test completed - check for red dot on Notifications tab!');
  };

  // Test achievement badge functionality
  const triggerAchievementBadgeTest = () => {
    console.log('🧪 Testing achievement badge functionality...');

    // Simulate new achievements by adding a fake achievement to test the badge
    const testAchievement = {
      id: 'test-achievement-' + Date.now(),
      title: 'Test Achievement',
      description: 'This is a test achievement to verify badge functionality',
      icon: '🏆',
      unlocked: true,
      progress: 100,
      target: 1,
      current: 1,
      date: new Date().toISOString()
    };

    // Add test achievement to existing achievements
    setUserAchievements(prev => ({
      ...prev,
      unlocked: [...(prev.unlocked || []), testAchievement],
      totalUnlocked: (prev.totalUnlocked || 0) + 1
    }));

    // Add test notification
    const testNotification = {
      id: 'test-notification-' + Date.now(),
      type: 'achievement_unlocked',
      title: '🏆 Test Achievement Unlocked!',
      message: 'This is a test to verify the achievement badge works correctly.',
      time: 'Just now',
      read: false,
      actionUrl: '/dashboard?tab=achievements',
      actionText: 'View Achievement'
    };

    setUserNotifications(prev => [testNotification, ...prev]);

    console.log('🧪 Achievement badge test completed - check for red dot on Achievements tab!');
  };

  // Make test functions available globally for testing
  useEffect(() => {
    window.triggerManualCourseCompletion = triggerManualCourseCompletion;
    window.triggerAchievementBadgeTest = triggerAchievementBadgeTest;
    window.triggerNotificationBadgeTest = triggerNotificationBadgeTest;
    window.triggerStatisticsBadgeTest = triggerStatisticsBadgeTest;

    return () => {
      delete window.triggerManualCourseCompletion;
      delete window.triggerAchievementBadgeTest;
      delete window.triggerNotificationBadgeTest;
      delete window.triggerStatisticsBadgeTest;
    };
  }, [courseCatalog, achievements]);

  // Image editing handler functions
  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target.result);
        // Reset image transformations when new image is uploaded
        setImageRotation(0);
        setImageFlipH(false);
        setImageFlipV(false);
        // Reset crop states
        setImageScale(1);
        setImagePosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Facebook-style drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - imagePosition.x,
      y: touch.clientY - imagePosition.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    setImagePosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const rotateImage = (degrees) => {
    setImageRotation(prev => prev + degrees);
  };

  const flipImage = (direction) => {
    if (direction === 'horizontal') {
      setImageFlipH(prev => !prev);
    } else {
      setImageFlipV(prev => !prev);
    }
  };

  const resetImage = () => {
    setImageRotation(0);
    setImageFlipH(false);
    setImageFlipV(false);
  };

  const getImageTransform = () => {
    const transforms = [];
    if (imageRotation !== 0) {
      transforms.push(`rotate(${imageRotation}deg)`);
    }
    if (imageFlipH) {
      transforms.push('scaleX(-1)');
    }
    if (imageFlipV) {
      transforms.push('scaleY(-1)');
    }
    return transforms.join(' ');
  };

  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCertificates = (userCertificates || []).filter(cert => {
    const matchesFilter = filter === 'all' || (cert.category && cert.category.toLowerCase() === filter.toLowerCase());
    const matchesSearch = !searchQuery ||
      (cert.courseName && cert.courseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cert.verificationCode && cert.verificationCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cert.title && cert.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Filter courses based on selected filter
  const filteredCourses = (courseCatalog || []).filter(course => {
    // Find progress for this specific course
    const courseProgressData = (courseProgress || []).find(cp => cp.courseId === course.id);

    // Enhanced completion detection with multiple fallback methods
    const totalLessons = course.lessons?.length || 0;
    const completedLessons = courseProgressData?.completedLessons?.length || 0;
    const lessonBasedCompletion = completedLessons >= totalLessons && totalLessons > 0;

    // Fallback to course catalog progress
    const catalogProgress = course.progress || 0;
    const progressBasedCompletion = catalogProgress >= 100;

    // Fallback to API progress data
    const apiProgress = courseProgressData?.overallProgress || 0;
    const apiBasedCompletion = apiProgress >= 100;

    // Use the most reliable method
    const isCompleted = lessonBasedCompletion || progressBasedCompletion || apiBasedCompletion;
    const hasStarted = catalogProgress > 0 || apiProgress > 0 || completedLessons > 0;

    switch (courseFilter) {
      case 'in-progress':
        return hasStarted && !isCompleted;
      case 'not-started':
        return !hasStarted;
      case 'completed':
        return isCompleted;
      case 'all':
      default:
        return true;
    }
  });

  // Generate achievements based on user progress
  const generateUserAchievements = () => {
    // Enhanced completion detection for achievements with multiple fallback methods
    const completedCourses = (courseProgress || []).filter(cp => {
      const course = (courseCatalog || []).find(c => c.id === cp.courseId);
      if (!course) return false;

      const totalLessons = course.lessons?.length || 0;
      const completedLessons = cp.completedLessons?.length || 0;
      const lessonBasedCompletion = completedLessons >= totalLessons && totalLessons > 0;

      // Fallback to course catalog progress
      const catalogProgress = course.progress || 0;
      const progressBasedCompletion = catalogProgress >= 100;

      // Fallback to API progress data
      const apiProgress = cp.overallProgress || 0;
      const apiBasedCompletion = apiProgress >= 100;

      // Use the most reliable method
      const isCompleted = lessonBasedCompletion || progressBasedCompletion || apiBasedCompletion;

      return isCompleted;
    }).length;

    const totalScore = stats?.totalScore || 0;
    const totalCourses = (courseCatalog || []).length || 0;

    console.log(`Generating achievements: ${completedCourses} courses completed, ${totalScore} total score`);

    const coursesInProgress = (courseProgress || []).filter(cp => !cp.isCompleted && cp.overallProgress > 0).length;
    const averageScore = stats?.averageScore || 0;

    const achievementList = [
      {
        id: 'first_course',
        title: 'First Steps',
        description: 'Complete your first cacao course',
        icon: <FiBookOpen />,
        unlocked: completedCourses >= 1,
        progress: Math.min(completedCourses * 100, 100),
        target: 1,
        current: completedCourses,
        date: completedCourses >= 1 ? new Date().toISOString() : null
      },
      {
        id: 'cacao_beginner',
        title: 'Cacao Beginner',
        description: 'Complete 3 cacao courses',
        icon: <FiStar />,
        unlocked: completedCourses >= 3,
        progress: Math.min((completedCourses / 3) * 100, 100),
        target: 3,
        current: completedCourses,
        date: completedCourses >= 3 ? new Date().toISOString() : null
      },
      {
        id: 'dedicated_farmer',
        title: 'Dedicated Farmer',
        description: 'Complete 5 cacao courses',
        icon: <FiHeart />,
        unlocked: completedCourses >= 5,
        progress: Math.min((completedCourses / 5) * 100, 100),
        target: 5,
        current: completedCourses,
        date: completedCourses >= 5 ? new Date().toISOString() : null
      },
      {
        id: 'high_achiever',
        title: 'High Achiever',
        description: 'Score over 500 total points',
        icon: <FiTrendingUp />,
        unlocked: totalScore >= 500,
        progress: Math.min((totalScore / 500) * 100, 100),
        target: 500,
        current: totalScore,
        date: totalScore >= 500 ? new Date().toISOString() : null
      },
      {
        id: 'expert_farmer',
        title: 'Expert Farmer',
        description: 'Complete 8 cacao courses',
        icon: <FiTarget />,
        unlocked: completedCourses >= 8,
        progress: Math.min((completedCourses / 8) * 100, 100),
        target: 8,
        current: completedCourses,
        date: completedCourses >= 8 ? new Date().toISOString() : null
      },
      {
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Score over 1000 total points',
        icon: <FiZap />,
        unlocked: totalScore >= 1000,
        progress: Math.min((totalScore / 1000) * 100, 100),
        target: 1000,
        current: totalScore,
        date: totalScore >= 1000 ? new Date().toISOString() : null
      },
      {
        id: 'consistent_learner',
        title: 'Consistent Learner',
        description: 'Have 3 courses in progress',
        icon: <FiBarChart2 />,
        unlocked: coursesInProgress >= 3,
        progress: Math.min((coursesInProgress / 3) * 100, 100),
        target: 3,
        current: coursesInProgress,
        date: coursesInProgress >= 3 ? new Date().toISOString() : null
      },
      {
        id: 'cacao_master',
        title: 'Cacao Master',
        description: 'Complete all available courses',
        icon: <FiShield />,
        unlocked: completedCourses >= totalCourses && totalCourses > 0,
        progress: totalCourses > 0 ? Math.min((completedCourses / totalCourses) * 100, 100) : 0,
        target: totalCourses,
        current: completedCourses,
        date: completedCourses >= totalCourses && totalCourses > 0 ? new Date().toISOString() : null
      },
      // New motivational achievements
      {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Complete a course within the first week',
        icon: <FiSun />,
        unlocked: completedCourses >= 1, // Simplified for demo
        progress: Math.min(completedCourses * 100, 100),
        target: 1,
        current: completedCourses,
        date: completedCourses >= 1 ? new Date().toISOString() : null
      },
      {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Study during evening hours',
        icon: <FiMoon />,
        unlocked: totalScore >= 100, // Simplified for demo
        progress: Math.min((totalScore / 100) * 100, 100),
        target: 100,
        current: totalScore,
        date: totalScore >= 100 ? new Date().toISOString() : null
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Achieve 90% or higher average score',
        icon: <FiCheckCircle />,
        unlocked: averageScore >= 90,
        progress: Math.min((averageScore / 90) * 100, 100),
        target: 90,
        current: averageScore,
        date: averageScore >= 90 ? new Date().toISOString() : null
      },
      {
        id: 'enthusiast',
        title: 'Enthusiast',
        description: 'Complete 10 lessons total',
        icon: <FiGift />,
        unlocked: totalScore >= 200, // Simplified for demo
        progress: Math.min((totalScore / 200) * 100, 100),
        target: 200,
        current: totalScore,
        date: totalScore >= 200 ? new Date().toISOString() : null
      },
      {
        id: 'persistent',
        title: 'Persistent Farmer',
        description: 'Continue learning for 7 days straight',
        icon: <FiCalendar />,
        unlocked: completedCourses >= 2, // Simplified for demo
        progress: Math.min((completedCourses / 2) * 100, 100),
        target: 2,
        current: completedCourses,
        date: completedCourses >= 2 ? new Date().toISOString() : null
      },
      {
        id: 'quick_learner',
        title: 'Quick Learner',
        description: 'Complete 2 courses in one day',
        icon: <FiClock />,
        unlocked: completedCourses >= 2, // Simplified for demo
        progress: Math.min((completedCourses / 2) * 100, 100),
        target: 2,
        current: completedCourses,
        date: completedCourses >= 2 ? new Date().toISOString() : null
      },
      {
        id: 'knowledge_seeker',
        title: 'Knowledge Seeker',
        description: 'Score over 1500 total points',
        icon: <FiHash />,
        unlocked: totalScore >= 1500,
        progress: Math.min((totalScore / 1500) * 100, 100),
        target: 1500,
        current: totalScore,
        date: totalScore >= 1500 ? new Date().toISOString() : null
      },
      {
        id: 'champion',
        title: 'Cacao Champion',
        description: 'Complete 10 courses with 80% average',
        icon: <FiAward />,
        unlocked: completedCourses >= 10 && averageScore >= 80,
        progress: Math.min((completedCourses / 10) * 100, 100),
        target: 10,
        current: completedCourses,
        date: completedCourses >= 10 && averageScore >= 80 ? new Date().toISOString() : null
      }
    ];

    return achievementList;
  };

  const viewCertificate = async (cert) => {
    try {
      console.log('Viewing certificate for course:', cert.courseId);

      // Generate and download the PDF
      const pdfBlob = await certificateAPI.downloadCertificate(cert.courseId);

      // Create a blob URL to view the PDF
      const url = window.URL.createObjectURL(pdfBlob);

      // Open PDF in a new tab for viewing
      window.open(url, '_blank');

      // Clean up the URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

    } catch (error) {
      console.error('Error viewing certificate:', error);
      alert('Error viewing certificate. Please try again.');
    }
  };

  const closeCertificateModal = () => {
    setSelectedCertificate(null);
  };

  const downloadCertificate = async (cert) => {
    try {
      console.log('Downloading certificate for course:', cert.courseId);

      // Generate and download the PDF
      const pdfBlob = await certificateAPI.downloadCertificate(cert.courseId);

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

      console.log('✅ Certificate downloaded successfully');

    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error downloading certificate. Please try again.');
    }
  };

  const shareCertificate = (cert) => {
    // In a real app, this would open a share dialog
    console.log('Sharing certificate:', cert.id);
    if (navigator.share) {
      navigator.share({
        title: `My ${cert.courseName} Certificate`,
        text: `Check out my certificate for completing ${cert.courseName} with a score of ${cert.score}%!`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareUrl = `${window.location.origin}/certificate/${cert.verificationCode}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Certificate link copied to clipboard!');
      });
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        setCurrentUser(prev => ({ ...prev, ...userData }));
        await fetchCourses();
      } catch (error) {
        console.error('Error loading initial data:', error);
        setCatalogError('Failed to load initial data. Please try again.');
      }
    };

    loadInitialData();
  }, []);

  // Log the courses data when it's loaded
  useEffect(() => {
    if (courseCatalog && courseCatalog.length > 0) {
      console.log('=== Course Data Analysis ===');
      courseCatalog.forEach((course, index) => {
        console.log(`Course ${index + 1}:`, {
          id: course.id,
          title: course.title,
          image: course.image,
          imagePath: getImagePath(course.image, course.title)
        });
      });
    }
  }, [courseCatalog]);

  // Update stats when courses are loaded
  useEffect(() => {
    if (courseCatalog && courseCatalog.length > 0) {
      const inProgress = courseCatalog.filter(course => course.progress > 0 && course.progress < 100).length;
      const completed = courseCatalog.filter(course => course.progress === 100).length;
      const totalScore = courseCatalog.reduce((sum, course) => sum + (course.score || 0), 0);
      const averageScore = courseCatalog.length > 0 ? Math.round(totalScore / courseCatalog.length) : 0;

      setStats({
        totalCourses: courseCatalog.length,
        inProgress,
        completed,
        averageScore
      });
    }
  }, [courseCatalog]);

  const fetchCourses = async () => {
    setCatalogLoading(true);
    setCatalogError(null);

    try {
      // Use the real API call instead of mock data
      const courses = await fetchCoursesFromAPI();
      setCourseCatalog(courses);
      console.log('Courses loaded from API:', courses);
    } catch (error) {
      console.error('Error in fetchCourses:', error);

      // Fallback to mock data if API fails
      console.log('API failed, using mock data as fallback');
      const mockCourses = [
        {
          id: 'cacao-basics',
          title: 'Cacao Basics',
          description: 'Learn the essential knowledge about cacao plants, varieties, and their requirements.',
          progress: 0,
          lessons: [1, 2, 3, 4], // 4 lessons
          duration: '1.5 hours',
          image: 'CacaoBacics.png',
          category: 'Beginner',
          score: 0,
          lastAccessed: 'Not started'
        },
        {
          id: 'planting-techniques',
          title: 'Planting Techniques',
          description: 'Master the best practices for planting cacao, soil preparation, and seedling care.',
          progress: 0,
          lessons: [1, 2, 3, 4], // 4 lessons
          duration: '2 hours',
          image: 'PlantingTech.png',
          category: 'Beginner',
          score: 0,
          lastAccessed: 'Not started'
        },
        {
          id: 'harvest-processing',
          title: 'Harvest & Processing',
          description: 'Master the art of harvesting, fermenting, drying, and processing cacao beans for premium quality.',
          progress: 0,
          lessons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // 11 lessons
          duration: '2.5 hours',
          image: 'Harvest.png',
          category: 'Intermediate',
          score: 0,
          lastAccessed: 'Not started'
        }
      ];

      setCourseCatalog(mockCourses);
      setCatalogError('Failed to load courses from server. Using offline data.');
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileCard = () => setShowProfileCard(!showProfileCard);

  const getProgressColor = (progress) => {
    if (progress < 30) return '#FF6B6B';
    if (progress < 70) return '#FFD93D';
    return '#6BCB77';
  };

  const renderNotificationIcon = (iconType) => {
    switch (iconType) {
      case 'award':
        return <FiAward style={{ fontSize: '24px', color: '#FFD700' }} />;
      case 'bell':
        return <FiBell style={{ fontSize: '24px', color: '#8B5A2B' }} />;
      case 'certificate':
        return <FiAward style={{ fontSize: '24px', color: '#4CAF50' }} />;
      case 'star':
        return <FiStar style={{ fontSize: '24px', color: '#FFA500' }} />;
      default:
        return <FiBell style={{ fontSize: '24px', color: '#8B5A2B' }} />;
    }
  };

  // Get next achievement for user
  const getNextAchievement = () => {
    if (!userAchievements || !userAchievements.locked || userAchievements.locked.length === 0) {
      return '🎉 All Complete!';
    }

    // Return the first locked achievement with progress info
    const nextAchievement = userAchievements.locked[0];
    const progress = nextAchievement.current || 0;
    const target = nextAchievement.target || 1;

    if (nextAchievement.category === 'course_completion') {
      return `${target - progress} more course${target - progress > 1 ? 's' : ''}`;
    } else if (nextAchievement.category === 'quiz_score') {
      return `Score ${target}% in quiz`;
    } else if (nextAchievement.category === 'time_spent') {
      return `${target - progress} more hours`;
    } else {
      return `${target - progress} to go`;
    }
  };

  // Get next achievement title
  const getNextAchievementTitle = () => {
    if (!userAchievements || !userAchievements.locked || userAchievements.locked.length === 0) {
      return 'Next Achievement';
    }

    const nextAchievement = userAchievements.locked[0];
    return nextAchievement.title || 'Next Achievement';
  };

  const renderStatsCard = (icon, title, value, color) => (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}`, backgroundColor: '#ffffff' }}>
      <div className="stat-icon" style={{ backgroundColor: `${color}15` }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedUser({ ...currentUser });
    } else {
      // Save changes when exiting edit mode
      setCurrentUser({ ...editedUser });
      // Here you would typically make an API call to save the changes
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(editedUser));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'cover') {
          setCoverPhoto(reader.result);
        } else {
          setProfilePhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, or GIF)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* OTP Display Component */}
      <OTPDisplay />

      {/* Welcome Notification */}
      {showWelcomeNotification && (
        <div className="welcome-notification">
          <div className="welcome-notification-content">
            <div className="welcome-icon">👋</div>
            <div>
              <h4>Welcome back, {getFirstName(currentUser.name) || 'User'}!</h4>
              <p>You have successfully logged in as {currentUser.email || 'your account'}.</p>
            </div>
            <button
              className="close-notification"
              onClick={() => setShowWelcomeNotification(false)}
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <h2>AgriLearn <span className="accent-text">Cacao</span></h2>
          </div>
          <button onClick={toggleSidebar} className="menu-toggle">
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <div className="user-profile" onClick={() => {
          handleTabChange('profile');
        }}>
          <div className="avatar">
            {currentUser.profilePicture ? (
              <img
                src={`http://localhost:5000${currentUser.profilePicture}`}
                alt="Profile"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="avatar-placeholder" style={{ display: currentUser.profilePicture ? 'none' : 'flex' }}>
              <FiUser />
            </div>
          </div>
          <div className="user-info">
            <h3>{currentUser.name || 'User'}</h3>
          </div>
        </div>

        <nav>
          <ul>
            <li
              className={activeTab === 'dashboard' ? 'active' : ''}
              onClick={() => handleTabChange('dashboard')}
            >
              <FiHome className="nav-icon" />
              <span>Dashboard</span>
            </li>
            <li
              className={activeTab === 'statistics' ? 'active' : ''}
              onClick={() => handleTabChange('statistics')}
            >
              <div className="nav-icon-container">
                <FiBarChart2 className="nav-icon" />
                {showStatisticsBadge && (
                  <span className="notification-badge"></span>
                )}
              </div>
              <span>Statistics</span>
            </li>
            <li
              className={activeTab === 'scores' ? 'active' : ''}
              onClick={() => handleTabChange('scores')}
            >
              <div className="nav-icon-container">
                <FiAward className="nav-icon" />
                {showQuizScoresBadge && (
                  <span className="notification-badge"></span>
                )}
              </div>
              <span>Quiz Scores</span>
            </li>
            <li
              className={activeTab === 'notifications' ? 'active' : ''}
              onClick={() => handleTabChange('notifications')}
            >
              <div className="nav-icon-container">
                <FiBell className="nav-icon" />
                {!notificationsLoading && unreadNotificationsCount > 0 && (
                  <span className="notification-badge"></span>
                )}
              </div>
              <span>Notifications</span>
            </li>
            <li
              className={activeTab === 'certificates' ? 'active' : ''}
              onClick={() => handleTabChange('certificates')}
            >
              <div className="nav-icon-container">
                <FiAward className="nav-icon" />
                {showCertificatesBadge && (
                  <span className="notification-badge"></span>
                )}
              </div>
              <span>Certificates</span>
            </li>
            <li
              className={activeTab === 'achievements' ? 'active' : ''}
              onClick={() => handleTabChange('achievements')}
            >
              <div className="nav-icon-container">
                <FiAward className="nav-icon" />
                {showAchievementsBadge && (
                  <span className="notification-badge"></span>
                )}
              </div>
              <span>Achievements</span>
            </li>
            <li
              className={activeTab === 'settings' ? 'active' : ''}
              onClick={() => handleTabChange('settings')}
            >
              <FiSettings className="nav-icon" />
              <span>Settings</span>
            </li>
            <li onClick={() => {
              handleLogout();
              if (sidebarOpen) {
                setSidebarOpen(false);
              }
            }} className="logout-btn">
              <FiLogOut className="nav-icon" />
              <span>Logout</span>
            </li>
          </ul>
        </nav>
      </div>

      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={toggleSidebar}></div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {activeTab !== 'profile' && (
          <header>
            <div className="header-top">
              <button onClick={toggleSidebar} className="burger-menu">
                <FiMenu />
              </button>
              <div className="header-content">
                <h1>Welcome back, {getFirstName(currentUser.name) || 'Farmer'}</h1>
              </div>
            </div>

            <div className="stats-container">
              {renderStatsCard(<FiBook className="stat-icon-book" />, 'Total Courses', stats.totalCourses, '#8B5A2B')}
              {renderStatsCard(<FiTarget className="stat-icon-achievement" />, getNextAchievementTitle(), getNextAchievement(), '#9C27B0')}
              {renderStatsCard(<FiBarChart2 className="stat-icon-score" />, 'Total Score', `${stats.totalScore}`, '#8BC34A')}
              {renderStatsCard(<FiStar className="stat-icon-average" />, 'Avg. Game Score', `${Math.round(quizStats.averageScore)}%`, '#FFA500')}
            </div>
          </header>
        )}

        {activeTab === 'dashboard' && (
          <div className="content-section">
            <div className="section-header">
              <h2>My Courses</h2>
              <select
                className="filter-dropdown"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <option value="all">All Courses</option>
                <option value="in-progress">In Progress</option>
                <option value="not-started">Not Started</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {catalogLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your courses...</p>
              </div>
            ) : catalogError ? (
              <div className="error-state">
                <p>{catalogError}</p>
                <button onClick={fetchCourses} className="retry-btn">
                  Retry
                </button>
              </div>
            ) : (
              <div className="courses-grid">
                {filteredCourses && filteredCourses.length > 0 ? filteredCourses.map(course => {
                  // Find progress for this specific course
                  const courseProgressData = (courseProgress || []).find(cp => cp.courseId === course.id);

                  // Enhanced completion detection with multiple fallback methods
                  const totalLessons = course.lessons?.length || 0;
                  const completedLessons = courseProgressData?.completedLessons?.length || 0;
                  const lessonBasedCompletion = completedLessons >= totalLessons && totalLessons > 0;

                  // Fallback to course catalog progress
                  const catalogProgress = course.progress || 0;
                  const progressBasedCompletion = catalogProgress >= 100;

                  // Fallback to API progress data
                  const apiProgress = courseProgressData?.overallProgress || 0;
                  const apiBasedCompletion = apiProgress >= 100;

                  // Use the most reliable method
                  const isCompleted = lessonBasedCompletion || progressBasedCompletion || apiBasedCompletion;

                  console.log(`Course ${course.title}:`, {
                    totalLessons,
                    completedLessons,
                    lessonBasedCompletion,
                    catalogProgress,
                    progressBasedCompletion,
                    apiProgress,
                    apiBasedCompletion,
                    finalIsCompleted: isCompleted
                  });

                  return (
                    <div key={course.id} className="course-card">
                      <div className="course-image" style={{ backgroundImage: `url(${getImagePath(course.image, course.title)})` }}>
                        <div className="course-category">{course.category}</div>
                        {isCompleted && (
                          <div className="completion-watermark">
                            <div className="completion-icon">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="completion-text">COMPLETED</div>
                          </div>
                        )}
                      </div>
                      <div className="course-content">
                        <div className="course-header">
                          <h3>{course.title}</h3>
                          <div className="course-meta">
                            <span>{course.lessons?.length || course.modules || 4} Modules</span>
                            <span>•</span>
                            <span>{course.duration}</span>
                          </div>
                        </div>
                        <p className="course-description">{course.description}</p>

                        <div className="course-footer">
                          <button
                            className={`action-btn ${course.progress > 0 ? 'continue-btn' : 'start-btn'}`}
                            onClick={() => navigate(`/courses/${course.id}/lessons`)}
                          >
                            {course.progress > 0 ? 'Continue' : 'Start Learning'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }) : filteredCourses.length === 0 ? (
                  <div className="no-courses">
                    <p>No courses found</p>
                  </div>
                ) : (
                  <div className="no-courses">
                    <p>No courses available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="certificates-container">
            <div className="certificates-header">
              <div>
                <h2>My Certificates</h2>
                <p>View and manage your course completion certificates</p>
              </div>
              <div className="certificates-actions">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search certificates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <FiSearch className="search-icon" />
                </div>
                <select
                  className="filter-dropdown"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {filteredCertificates.length === 0 ? (
              <div className="no-certificates">
                <div className="no-certificates-icon">🏆</div>
                <h3>No certificates found</h3>
                <p>Complete courses to earn certificates that will appear here</p>
                <button
                  className="browse-courses-btn"
                  onClick={() => handleTabChange('dashboard')}
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div className="certificates-grid">
                {filteredCertificates && filteredCertificates.length > 0 ? (
                  filteredCertificates.map(cert => (
                    <div key={cert.id || cert._id} className="certificate-card">
                      <div className="certificate-badge">
                        <FiAward className="trophy-icon" />
                      </div>
                      <div className="certificate-content">
                        <div className="certificate-header">
                          <span className={`certificate-category ${(cert.category || 'beginner').toLowerCase()}`}>
                            {cert.category || 'Beginner'}
                          </span>
                          <span className="certificate-score">
                            Score: {cert.score || cert.finalScore || 95}%
                          </span>
                        </div>
                        <div className="certificate-info">
                          <h4>{cert.title || cert.courseTitle || 'Course Certificate'}</h4>
                          <p>{cert.description || `Successfully completed ${cert.courseTitle || 'the course'}`}</p>
                          <div className="certificate-meta">
                            <span>Completed on: {new Date(cert.completionDate || cert.issueDate).toLocaleDateString()}</span>
                            <span>ID: {cert.verificationCode || cert.certificateId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="certificate-actions">
                        <button
                          className="view-btn"
                          onClick={() => viewCertificate(cert)}
                        >
                          <FiEye /> View
                        </button>
                        <button
                          className="download-btn"
                          onClick={() => downloadCertificate(cert)}
                        >
                          <FiDownload /> Download
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-certificates">
                    <div className="no-certificates-icon">🏆</div>
                    <h3>No certificates found</h3>
                    <p>Complete courses to earn certificates</p>
                  </div>
                )}
              </div>
            )}

            {/* Certificate Modal */}
            {selectedCertificate && (
              <div className="certificate-modal">
                <div className="certificate-modal-content">
                  <button className="close-modal-btn" onClick={closeCertificateModal}>
                    <FiX />
                  </button>
                  <div className="certificate-preview">
                    <img
                      src={`/images/certificates/${selectedCertificate.image}`}
                      alt={`${selectedCertificate.courseName} Certificate`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/certificates/certificate-placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="certificate-details">
                    <h3>{selectedCertificate.courseName}</h3>
                    <div className="detail-row">
                      <span className="detail-label">Issued to:</span>
                      <span className="detail-value">{currentUser.name || 'Farmer'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Completion Date:</span>
                      <span className="detail-value">
                        {new Date(selectedCertificate.completionDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Score:</span>
                      <span className="detail-value score-badge">
                        {selectedCertificate.score}%
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Verification ID:</span>
                      <span className="detail-value">{selectedCertificate.verificationCode}</span>
                    </div>
                    <div className="certificate-actions modal-actions">
                      <button
                        className="download-btn"
                        onClick={() => downloadCertificate(selectedCertificate)}
                      >
                        <FiDownload /> Download PDF
                      </button>
                      <button
                        className="share-btn"
                        onClick={() => shareCertificate(selectedCertificate)}
                      >
                        <FiShare2 /> Share
                      </button>
                      <button
                        className="verify-btn"
                        onClick={() => window.open(`/verify/${selectedCertificate.verificationCode}`, '_blank')}
                      >
                        <FiCheckCircle /> Verify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-container">
            <div className="notifications-header">
              <h2>Notifications</h2>
              <div className="notifications-actions">
                <button
                  className="mark-all-btn"
                  onClick={markAllAsRead}
                  disabled={unreadNotificationsCount === 0}
                >
                  Mark all as read
                </button>
              </div>
            </div>

            <div className="notifications-list">
              {userNotifications.length === 0 ? (
                <div className="no-notifications">
                  <div className="no-notifications-icon">🔔</div>
                  <h3>No notifications yet</h3>
                  <p>When you get notifications, they'll appear here</p>
                </div>
              ) : (
                userNotifications.map(notification => (
                  <div
                    key={notification.id || `${notification.type}-${notification.title}-${notification.time}`}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  >
                    <div className="notification-icon">
                      {renderNotificationIcon(notification.icon)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <h4 className="notification-title">{notification.title}</h4>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-actions">
                        {!notification.read && (
                          <button
                            className="mark-read-btn"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          className="delete-btn"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'scores' && (
          <div className="scores-container">
            <div className="section-header">
              <h2>Quiz Scores</h2>
              <div className="time-filter">
                <span className="time-filter-label">
                  {quizScoresLoading ? 'Loading...' : `${quizScores.length} Quiz${quizScores.length !== 1 ? 'zes' : ''} Taken`}
                </span>
              </div>
            </div>

            <div className="scores-overview">
              <div className="overall-score">
                <div className="score-circle">
                  <span className="score-percentage">{Math.round(quizStats.averageScore)}%</span>
                  <span className="score-label">Average Score</span>
                </div>
                <div className="score-details">
                  <h3>Quiz Performance Summary</h3>
                  <div className="score-metrics">
                    <div className="metric">
                      <span className="metric-value">{quizScores.filter(q => q.bestScore >= 80).length}</span>
                      <span className="metric-label">Excellent (80%+)</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{quizScores.filter(q => q.bestScore >= 60 && q.bestScore < 80).length}</span>
                      <span className="metric-label">Good (60-79%)</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{quizScores.filter(q => q.bestScore < 60).length}</span>
                      <span className="metric-label">Needs Work (&lt;60%)</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{quizStats.totalAttempts}</span>
                      <span className="metric-label">Total Attempts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="scores-table-container">
                <h3>Quiz History</h3>
                {quizScoresLoading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading quiz scores...</p>
                  </div>
                ) : quizScores.length === 0 ? (
                  <div className="no-scores">
                    <div className="no-scores-icon">
                      <FiTarget style={{ fontSize: '48px', color: '#8B5A2B' }} />
                    </div>
                    <h3>No quiz scores yet</h3>
                    <p>Take a quiz to see your scores here!</p>
                    <button
                      className="browse-courses-btn"
                      onClick={() => handleTabChange('dashboard')}
                    >
                      Browse Courses
                    </button>
                  </div>
                ) : (
                  <table className="scores-table">
                    <thead>
                      <tr>
                        <th>Quiz Name</th>
                        <th>Latest Score</th>
                        <th>Best Score</th>
                        <th>Average</th>
                        <th>Attempts</th>
                        <th>Questions</th>
                        <th>Time Taken</th>
                        <th>Last Played</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizScores.map((quizScore, index) => (
                        <tr key={`${quizScore.quizId}-${index}`}>
                          <td className="quiz-name">
                            <div className="quiz-icon">
                              <FiTarget style={{ color: '#8B5A2B' }} />
                            </div>
                            <span>{quizScore.quizName || quizScore.quizId}</span>
                          </td>
                          <td>
                            <span className={`score-badge ${quizScore.score >= 80 ? 'excellent' :
                              quizScore.score >= 60 ? 'good' : 'needs-work'
                              }`}>
                              {Math.round(quizScore.score)}%
                            </span>
                          </td>
                          <td>
                            <span className={`score-badge ${quizScore.bestScore >= 80 ? 'excellent' :
                              quizScore.bestScore >= 60 ? 'good' : 'needs-work'
                              }`}>
                              {Math.round(quizScore.bestScore)}%
                            </span>
                          </td>
                          <td>
                            <span className="score-value">
                              {Math.round(quizScore.averageScore)}%
                            </span>
                          </td>
                          <td>{quizScore.attempts}</td>
                          <td>
                            {quizScore.correctAnswers || 0}/{quizScore.totalQuestions || 0}
                          </td>
                          <td>
                            {quizScore.timeTaken ? `${Math.floor(quizScore.timeTaken / 60)}:${(quizScore.timeTaken % 60).toString().padStart(2, '0')}` : 'N/A'}
                          </td>
                          <td>
                            {quizScore.completedAt ? new Date(quizScore.completedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="statistics-container">
            <div className="section-header">
              <h2>Learning Statistics</h2>
              <div className="time-filter">
                <span className="time-filter-label">Time Period:</span>
                <select className="filter-dropdown">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                  <option>All Time</option>
                </select>
              </div>
            </div>

            <div className="stats-overview">
              <div className="stat-card large">
                <h3>Learning Progress</h3>
                <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>Overall progress across all 7 courses</p>
                <div className="progress-chart">
                  <div className="doughnut-chart-container">
                    <Doughnut
                      data={{
                        labels: ['Completed', 'Remaining'],
                        datasets: [{
                          data: [realStats.averageProgress || 0, 100 - (realStats.averageProgress || 0)],
                          backgroundColor: [
                            '#4CAF50',
                            '#f0f0f0'
                          ],
                          borderColor: [
                            '#45a049',
                            '#e0e0e0'
                          ],
                          borderWidth: 2,
                          hoverBackgroundColor: [
                            '#66BB6A',
                            '#e8e8e8'
                          ],
                          hoverBorderColor: [
                            '#45a049',
                            '#d0d0d0'
                          ],
                          hoverBorderWidth: 3
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        cutout: '70%',
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#4CAF50',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                              label: function (context) {
                                return context.label + ': ' + context.parsed + '%';
                              }
                            }
                          }
                        }
                      }}
                    />
                    <div className="doughnut-center-text">
                      <span className="doughnut-percentage">{realStats.averageProgress || 0}%</span>
                      <small className="doughnut-label">Overall</small>
                    </div>
                  </div>
                  <div className="progress-legend">
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
                      <span>Completed</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: '#f0f0f0' }}></span>
                      <span>Remaining</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#888' }}>
                    <strong>{realStats.completedCourses || 0}</strong> of <strong>7</strong> courses completed
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3>Course Completion</h3>
                <div className="bar-chart">
                  {(courseCatalog || []).map(course => {
                    // Find progress for this specific course
                    const courseProgressData = (courseProgress || []).find(cp => cp.courseId === course.id);
                    const progress = courseProgressData?.overallProgress || 0;

                    console.log(`Course: ${course.id}, Progress: ${progress}, Data:`, courseProgressData);

                    return (
                      <div key={course.id} className="bar-item">
                        <div className="bar-label">
                          <span className="truncate">{course.title}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="bar-bg">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: progress === 100 ? '#4CAF50' :
                                progress > 0 ? '#8BC34A' : '#f0f0f0'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="stat-card">
                <h3>Learning Streak</h3>
                <div className="streak-count">
                  <span className="streak-number">5</span>
                  <span className="streak-label">days</span>
                </div>
                <p className="streak-message">Keep it up! You're on a roll!</p>
                <div className="streak-calendar">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`streak-day ${i < 5 ? 'active' : ''}`}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}
                    </div>
                  ))}
                </div>
              </div>

              <div className="stat-card">
                <h3>Time Spent</h3>
                <div className="time-spent">
                  <div className="time-spent-item">
                    <span className="time-value">{userActivity.timeSpentThisWeek}</span>
                    <span className="time-unit">hours</span>
                    <span className="time-label">This Week</span>
                  </div>
                  <div className="time-spent-item">
                    <span className="time-value">{userActivity.timeSpentTotal}</span>
                    <span className="time-unit">hours</span>
                    <span className="time-label">Total</span>
                  </div>
                </div>
                <div className="time-trend">
                  <span className="trend-up">↑ {userActivity.timeTrend}h</span>
                  <span>more than last week</span>
                </div>
              </div>

              <div className="stat-card user-activity-card">
                <h3>User Activity</h3>
                <div className="user-activity-enhanced">
                  <div className="activity-item-enhanced">
                    <div className="activity-icon-wrapper">
                      <FiBookOpen style={{ fontSize: '28px', color: '#8B5A2B' }} />
                    </div>
                    <div className="activity-content">
                      <span className="activity-value-large">{realStats.inProgressCourses || 0}</span>
                      <span className="activity-label">Courses in Progress</span>
                      <div className="activity-progress-bar">
                        <div className="activity-progress-fill" style={{ width: `${(realStats.inProgressCourses / 7) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="activity-item-enhanced">
                    <div className="activity-icon-wrapper">
                      <FiCheckCircle style={{ fontSize: '28px', color: '#4CAF50' }} />
                    </div>
                    <div className="activity-content">
                      <span className="activity-value-large">{realStats.totalLessons || 0}</span>
                      <span className="activity-label">Lessons Completed</span>
                      <div className="activity-progress-bar">
                        <div className="activity-progress-fill completed" style={{ width: `${(realStats.totalLessons / 51) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="activity-item-enhanced">
                    <div className="activity-icon-wrapper">
                      <FiAward style={{ fontSize: '28px', color: '#FFD700' }} />
                    </div>
                    <div className="activity-content">
                      <span className="activity-value-large">{userAchievements.totalUnlocked || 0}</span>
                      <span className="activity-label">Achievements Unlocked</span>
                      <div className="activity-progress-bar">
                        <div className="activity-progress-fill achievement" style={{ width: `${userAchievements.totalAvailable > 0 ? (userAchievements.totalUnlocked / userAchievements.totalAvailable) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="activity-item-enhanced">
                    <div className="activity-icon-wrapper">
                      <FiTarget style={{ fontSize: '28px', color: '#FFA500' }} />
                    </div>
                    <div className="activity-content">
                      <span className="activity-value-large">{realStats.completedCourses || 0}/7</span>
                      <span className="activity-label">Courses Completed</span>
                      <div className="activity-progress-bar">
                        <div className="activity-progress-fill completed-courses" style={{ width: `${(realStats.completedCourses / 7) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-container">
            <h2>Your Achievements</h2>
            <div className="achievements-header">
              <div className="achievements-stats">
                <div className="stat-card">
                  <h3>{userAchievements?.totalUnlocked || 0}</h3>
                  <p>Unlocked</p>
                </div>
                <div className="stat-card">
                  <h3>{userAchievements?.totalAvailable || 0}</h3>
                  <p>Total Available</p>
                </div>
                <div className="stat-card">
                  <h3>{userAchievements?.totalAvailable > 0 ? Math.round((userAchievements.totalUnlocked / userAchievements.totalAvailable) * 100) : 0}%</h3>
                  <p>Overall Progress</p>
                </div>
              </div>
            </div>

            <div className="achievements-grid">
              {/* Display unlocked achievements first */}
              {userAchievements?.unlocked?.map((userAch) => {
                const achievement = userAch.achievementId;
                if (!achievement) return null; // Skip if achievement data is missing

                return (
                  <div
                    key={achievement._id}
                    className="achievement-card unlocked"
                  >
                    <div className="achievement-icon">
                      <span className="icon">{getIconComponent(achievement.icon)}</span>
                      <span className="badge"><FiCheck /></span>
                    </div>
                    <div className="achievement-details">
                      <h3>{achievement.name}</h3>
                      <p>{achievement.description}</p>
                      <div className="achievement-date">
                        <span>Unlocked on {new Date(userAch.unlockedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Display locked achievements */}
              {userAchievements?.locked?.map((achievement) => (
                <div
                  key={achievement._id}
                  className="achievement-card locked"
                >
                  <div className="achievement-icon">
                    <span className="icon locked-icon"><FiLock /></span>
                    <span className="icon achievement-icon-bg">{getIconComponent(achievement.icon)}</span>
                  </div>
                  <div className="achievement-details">
                    <h3>{achievement.name}</h3>
                    <p>{achievement.description}</p>
                    <div className="progress-container">
                      <div
                        className="progress-bar"
                        style={{ width: '0%' }}
                      ></div>
                      <span className="progress-text">
                        {achievement.conditions?.target ? `0/${achievement.conditions.target}` : 'Locked'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-modern-container">
            {/* Back to Dashboard Button - Only visible on mobile */}
            <button
              onClick={() => handleTabChange('dashboard')}
              className="back-to-dashboard-btn mobile-only"
              aria-label="Back to Dashboard"
            >
              Back
            </button>

            {/* Profile Header Card */}
            <div className="profile-header-modern">
              <div className="profile-avatar-section">
                <div className="profile-avatar-modern">
                  {currentUser.profilePicture ? (
                    <img
                      src={`http://localhost:5000${currentUser.profilePicture}`}
                      alt="Profile"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="profile-avatar-placeholder" style={{ display: currentUser.profilePicture ? 'none' : 'flex' }}>
                    <FiUser size={48} />
                  </div>
                  <input
                    type="file"
                    id="modern-profile-pic-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('File size must be less than 5MB');
                        e.target.value = '';
                        return;
                      }

                      // Validate file type
                      if (!file.type.startsWith('image/')) {
                        toast.error('Please select an image file');
                        e.target.value = '';
                        return;
                      }

                      try {
                        toast.info('Uploading profile picture...');

                        // Debug: Check currentUser structure
                        console.log('Current user object:', currentUser);
                        console.log('User ID:', currentUser._id);
                        console.log('User ID type:', typeof currentUser._id);

                        // Safety check: if no _id, try to get it from storage or use email
                        let userId = currentUser._id;
                        if (!userId) {
                          // Try to get fresh user data from storage
                          const userFromLocal = localStorage.getItem('user');
                          const userFromSession = sessionStorage.getItem('user');
                          const userData = userFromLocal ? JSON.parse(userFromLocal) :
                            userFromSession ? JSON.parse(userFromSession) : null;
                          userId = userData?._id || userData?.id;
                          console.log('Fallback user ID from storage:', userId);
                        }

                        if (!userId) {
                          toast.error('User ID not found. Please log in again.');
                          e.target.value = '';
                          return;
                        }

                        const formData = new FormData();
                        formData.append('profilePicture', file);

                        // Debug: Check authentication token
                        const token = getAuthToken();

                        console.log('Profile upload token check:', {
                          hasToken: !!token,
                          tokenStart: token?.substring(0, 20) + '...',
                          userId: currentUser._id,
                          userEmail: currentUser.email
                        });

                        if (!token) {
                          toast.error('Authentication token not found. Please log in again.');
                          e.target.value = '';
                          return;
                        }

                        const response = await fetch(`http://localhost:5000/api/users/profile`, {
                          method: 'PUT',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          },
                          body: formData
                        });

                        if (response.ok) {
                          const responseData = await response.json();
                          console.log('Profile upload response:', responseData);

                          // Debug: Check current user structure before update
                          console.log('Current user before update:', {
                            name: currentUser.name,
                            fullName: currentUser.fullName,
                            firstName: currentUser.firstName,
                            surname: currentUser.surname
                          });

                          const updatedUser = responseData.user;

                          // Debug: Check new user structure
                          console.log('Updated user structure:', {
                            name: updatedUser.name,
                            fullName: updatedUser.fullName,
                            firstName: updatedUser.firstName,
                            surname: updatedUser.surname
                          });

                          setCurrentUser(updatedUser);

                          const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
                          storage.setItem('user', JSON.stringify(updatedUser));

                          toast.success('Profile picture updated successfully!');
                        } else {
                          // Handle different error statuses
                          const errorData = await response.json().catch(() => ({}));
                          console.error('Profile update error:', response.status, errorData);

                          if (response.status === 401) {
                            toast.error('Session expired. Please log in again.');
                            // Clear tokens and redirect to login
                            localStorage.removeItem('token');
                            sessionStorage.removeItem('token');
                            setTimeout(() => {
                              window.location.href = '/login';
                            }, 2000);
                          } else if (response.status === 404) {
                            toast.error('User not found. Please log in again.');
                          } else if (response.status === 413) {
                            toast.error('File too large. Please choose a smaller image.');
                          } else {
                            toast.error(errorData.message || 'Failed to update profile picture');
                          }
                        }
                      } catch (error) {
                        console.error('Error updating profile picture:', error);
                        toast.error('An error occurred while uploading');
                      } finally {
                        // Reset file input
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
                <div className="profile-user-info">
                  <h2 className="profile-user-name">{currentUser.name || 'User Name'}</h2>
                  <p className="profile-user-role">{currentUser.userRole || 'Farmer'}</p>
                  <p className="profile-user-location">
                    <FiMapPin /> {currentUser.address || 'Location not set'}
                  </p>
                </div>
                <div className="profile-action-buttons">
                  <button className="edit-btn-orange" onClick={() => document.getElementById('modern-profile-pic-input').click()}>
                    <FiUpload /> Upload Profile Picture
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Information Card */}
            <div className={`profile-info-card-modern ${isEditingPersonalInfo ? 'editing' : ''}`}>
              <div className="card-header-modern">
                <h3>Personal Information</h3>
                {!isEditingPersonalInfo ? (
                  <button className="edit-btn-gray" onClick={() => {
                    setIsEditingPersonalInfo(true);
                    setEditedUser({ ...currentUser });
                  }}>
                    <FiEdit2 /> Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="save-btn"
                      disabled={settingsLoading}
                      onClick={async () => {
                        try {
                          setSettingsLoading(true);
                          const formData = new FormData();
                          formData.append('firstName', editedUser.firstName || '');
                          formData.append('middleName', editedUser.middleName || '');
                          formData.append('surname', editedUser.surname || '');
                          formData.append('birthdate', editedUser.birthdate || '');
                          formData.append('contactNumber', editedUser.contactNumber || '');
                          formData.append('address', editedUser.address || '');
                          formData.append('gender', editedUser.gender || '');

                          const response = await fetch(`http://localhost:5000/api/users/profile`, {
                            method: 'PUT',
                            body: formData
                          });

                          if (response.ok) {
                            const responseData = await response.json();
                            const updatedUser = responseData.user;

                            setCurrentUser(updatedUser);
                            setEditedUser({ ...updatedUser });

                            const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
                            storage.setItem('user', JSON.stringify(updatedUser));

                            toast.success('✓ Profile updated successfully!');
                            setIsEditingPersonalInfo(false);
                          } else {
                            toast.error('Failed to update profile');
                          }
                        } catch (error) {
                          console.error('Error updating profile:', error);
                          toast.error('An error occurred while updating your profile');
                        } finally {
                          setSettingsLoading(false);
                        }
                      }}
                    >
                      {settingsLoading ? (
                        <>
                          <div className="spinner"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiCheck /> Save Changes
                        </>
                      )}
                    </button>
                    <button
                      className="cancel-btn"
                      disabled={settingsLoading}
                      onClick={() => {
                        setIsEditingPersonalInfo(false);
                        setEditedUser({ ...currentUser });
                      }}
                    >
                      <FiX /> Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="card-content-grid">
                <div className="info-field-modern">
                  <label>First Name</label>
                  {isEditingPersonalInfo ? (
                    <input
                      type="text"
                      value={editedUser.firstName || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                      placeholder="Enter first name"
                      required
                    />
                  ) : (
                    <p>{currentUser.firstName || 'Not set'}</p>
                  )}
                </div>
                <div className="info-field-modern">
                  <label>Middle Name</label>
                  {isEditingPersonalInfo ? (
                    <input
                      type="text"
                      value={editedUser.middleName || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, middleName: e.target.value })}
                      placeholder="Enter middle name (optional)"
                    />
                  ) : (
                    <p>{currentUser.middleName || 'Not set'}</p>
                  )}
                </div>
                <div className="info-field-modern">
                  <label>Last Name</label>
                  {isEditingPersonalInfo ? (
                    <input
                      type="text"
                      value={editedUser.surname || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, surname: e.target.value })}
                      placeholder="Enter last name"
                      required
                    />
                  ) : (
                    <p>{currentUser.surname || 'Not set'}</p>
                  )}
                </div>
                <div className="info-field-modern">
                  <label>Date of Birth</label>
                  {isEditingPersonalInfo ? (
                    <input
                      type="date"
                      value={editedUser.birthdate ? new Date(editedUser.birthdate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditedUser({ ...editedUser, birthdate: e.target.value })}
                      required
                    />
                  ) : (
                    <p>
                      {(() => {
                        if (currentUser.birthdate) {
                          try {
                            const date = new Date(currentUser.birthdate);
                            if (isNaN(date.getTime())) {
                              return currentUser.birthdate;
                            }
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          } catch (error) {
                            return currentUser.birthdate || 'Not set';
                          }
                        }
                        return 'Not set';
                      })()}
                    </p>
                  )}
                </div>
                <div className="info-field-modern">
                  <label>Email Address {isEditingPersonalInfo && <span style={{ fontSize: '0.75rem', color: '#999', textTransform: 'none', fontWeight: 400 }}>(Cannot be changed)</span>}</label>
                  <p style={{ color: '#666' }}>{currentUser.email || 'Not set'}</p>
                </div>
                <div className="info-field-modern">
                  <label>Phone Number</label>
                  {isEditingPersonalInfo ? (
                    <input
                      type="tel"
                      value={editedUser.contactNumber || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, contactNumber: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p>{currentUser.contactNumber || 'Not set'}</p>
                  )}
                </div>
                <div className="info-field-modern">
                  <label>Gender</label>
                  {isEditingPersonalInfo ? (
                    <select
                      value={editedUser.gender || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p>{currentUser.gender ? currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1) : 'Not set'}</p>
                  )}
                </div>
                <div className="info-field-modern" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  {isEditingPersonalInfo ? (
                    <textarea
                      value={editedUser.address || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                      placeholder="Enter your full address"
                      rows="3"
                    />
                  ) : (
                    <p>{currentUser.address || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-container">

            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <div className="settings-options">
                <div className="setting-option">
                  <div>
                    <h4>Email Notifications</h4>
                    <p>Receive updates and announcements via email</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="setting-option">
                  <div>
                    <h4>Push Notifications</h4>
                    <p>Get instant notifications on your device</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="setting-option">
                  <div>
                    <h4>Course Updates</h4>
                    <p>Get notified about new courses and updates</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.courseUpdates}
                      onChange={(e) => handleSettingChange('courseUpdates', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy and Security Section */}
            <div className="settings-section">
              <h3>Privacy and Security</h3>
              <div className="settings-options">
                <div className="setting-option">
                  <div>
                    <h4>Change Password</h4>
                    <p>Update your account password</p>
                  </div>
                  <button
                    className="change-password-btn"
                    onClick={() => setSelectedPrivacyOption(selectedPrivacyOption === 'password' ? null : 'password')}
                  >
                    <FiLock /> Change
                  </button>
                </div>

                {selectedPrivacyOption === 'password' && (
                  <div className="password-form-container">
                    {!showOTPVerification ? (
                      <form onSubmit={handlePasswordChange} className="password-form">
                        <div className="password-fields">
                          <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <div className="password-input-wrapper">
                              <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                id="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                placeholder="Enter current password"
                                disabled={passwordLoading}
                              />
                              <button
                                type="button"
                                className="toggle-password-btn"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                tabIndex={-1}
                              >
                                {showCurrentPassword ? <FiEye /> : <FiLock />}
                              </button>
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="password-input-wrapper">
                              <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                placeholder="Enter new password (min. 6 characters)"
                                disabled={passwordLoading}
                              />
                              <button
                                type="button"
                                className="toggle-password-btn"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                tabIndex={-1}
                              >
                                {showNewPassword ? <FiEye /> : <FiLock />}
                              </button>
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <div className="password-input-wrapper">
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                placeholder="Confirm new password"
                                disabled={passwordLoading}
                              />
                              <button
                                type="button"
                                className="toggle-password-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                              >
                                {showConfirmPassword ? <FiEye /> : <FiLock />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {passwordError && (
                          <div className="error-message">
                            <FiX /> {passwordError}
                          </div>
                        )}

                        {passwordSuccess && (
                          <div className="success-message">
                            <FiCheck /> Password changed successfully!
                          </div>
                        )}

                        <div className="password-actions">
                          <button
                            type="submit"
                            className="save-btn"
                            disabled={passwordLoading}
                          >
                            {passwordLoading ? (
                              <>
                                <div className="spinner"></div>
                                Sending OTP...
                              </>
                            ) : (
                              <>
                                <FiShield /> Send OTP
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="cancel-btn"
                            onClick={cancelPasswordChange}
                            disabled={passwordLoading}
                          >
                            <FiX /> Clear
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="otp-verification-container">
                        <div className="otp-header">
                          <FiMail className="otp-icon" />
                          <h4>Verify Your Identity</h4>
                          <p>We've sent a 6-digit OTP to your email address for password change confirmation.</p>
                        </div>

                        <form onSubmit={handleOTPVerification} className="otp-form">
                          <div className="otp-inputs">
                            {otpCode.map((digit, index) => (
                              <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                className="otp-input"
                                value={digit}
                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                onKeyDown={(e) => handleOTPKeyPress(e, index)}
                                maxLength={1}
                                disabled={otpLoading || otpSuccess}
                                placeholder="0"
                              />
                            ))}
                          </div>

                          {otpError && (
                            <div className="error-message">
                              <FiX /> {otpError}
                            </div>
                          )}

                          {otpSuccess && (
                            <div className="success-message">
                              <FiCheck /> Password changed successfully!
                            </div>
                          )}

                          <div className="otp-actions">
                            <button
                              type="submit"
                              className="save-btn"
                              disabled={otpLoading || otpSuccess}
                            >
                              {otpLoading ? (
                                <>
                                  <div className="spinner"></div>
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <FiCheck /> Verify & Change Password
                                </>
                              )}
                            </button>

                            <div className="otp-secondary-actions">
                              <button
                                type="button"
                                className="resend-btn"
                                onClick={handleResendOTP}
                                disabled={otpResendTimer > 0 || otpLoading || otpSuccess}
                              >
                                {otpResendTimer > 0 ? (
                                  <>Resend OTP ({otpResendTimer}s)</>
                                ) : (
                                  <>
                                    <FiRefreshCw /> Resend OTP
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                className="cancel-btn"
                                onClick={cancelPasswordChange}
                                disabled={otpLoading || otpSuccess}
                              >
                                <FiX /> Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="save-btn"
                onClick={handleSaveSettings}
                disabled={settingsLoading}
              >
                {settingsLoading ? (
                  <>
                    <div className="spinner"></div>
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <FiSave /> Save Settings
                  </>
                )}
              </button>
              <button
                className="cancel-btn"
                onClick={handleDiscardChanges}
                disabled={settingsLoading}
              >
                <FiX /> Reset to Default
              </button>
              {settingsSuccess && (
                <div className="success-message">
                  <FiCheck /> Settings saved successfully!
                </div>
              )}
            </div>
          </div>
        )}

      </div>


      {/* Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiEdit2 /> Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn">
                <FiX />
              </button>
            </div>
            <form className="edit-form" onSubmit={async (e) => {
              e.preventDefault();

              try {
                const formData = new FormData();

                // Add text fields
                formData.append('firstName', editedUser.firstName || '');
                formData.append('middleName', editedUser.middleName || '');
                formData.append('surname', editedUser.surname || '');
                formData.append('birthdate', editedUser.birthdate || '');
                formData.append('contactNumber', editedUser.contactNumber || '');
                formData.append('address', editedUser.address || '');
                formData.append('gender', editedUser.gender || '');

                // Add profile picture if selected
                const fileInput = document.getElementById('profile-picture-input');
                if (fileInput && fileInput.files[0]) {
                  formData.append('profilePicture', fileInput.files[0]);
                }

                // Safety check: ensure we have a valid user ID
                let userId = currentUser._id;
                if (!userId) {
                  // Try to get fresh user data from storage
                  const userFromLocal = localStorage.getItem('user');
                  const userFromSession = sessionStorage.getItem('user');
                  const userData = userFromLocal ? JSON.parse(userFromLocal) :
                    userFromSession ? JSON.parse(userFromSession) : null;
                  userId = userData?._id || userData?.id;
                }

                if (!userId) {
                  toast.error('User ID not found. Please log in again.');
                  return;
                }

                const response = await fetch(`http://localhost:5000/api/users/profile`, {
                  method: 'PUT',
                  body: formData
                });

                if (response.ok) {
                  const responseData = await response.json();
                  console.log('Profile form update response:', responseData);

                  // Debug: Check current user structure before update
                  console.log('Current user before form update:', {
                    name: currentUser.name,
                    fullName: currentUser.fullName,
                    firstName: currentUser.firstName,
                    surname: currentUser.surname
                  });

                  const updatedUser = responseData.user;

                  // Debug: Check new user structure
                  console.log('Updated user structure from form:', {
                    name: updatedUser.name,
                    fullName: updatedUser.fullName,
                    firstName: updatedUser.firstName,
                    surname: updatedUser.surname
                  });

                  setCurrentUser(updatedUser);
                  setEditedUser({ ...updatedUser });
                  setProfilePhoto('');

                  // Update localStorage
                  const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
                  storage.setItem('user', JSON.stringify(updatedUser));

                  toast.success('Profile updated successfully!');
                  setShowEditModal(false);
                } else {
                  toast.error('Failed to update profile');
                }
              } catch (error) {
                console.error('Error updating profile:', error);
                toast.error('An error occurred while updating your profile');
              }
            }}>

              {/* Enhanced Profile Picture Upload */}
              <div className="profile-picture-upload-enhanced">
                <div className="upload-header">
                  <h3><FiUpload /> Profile Picture</h3>
                  <p>Upload a photo to personalize your profile</p>
                </div>

                <div className="profile-picture-upload-area">
                  <div
                    className="picture-preview-large"
                    onClick={() => document.getElementById('profile-picture-input').click()}
                  >
                    {profilePhoto || currentUser.profilePicture ? (
                      <>
                        <img
                          src={profilePhoto || `http://localhost:5000${currentUser.profilePicture}`}
                          alt="Profile"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="picture-hover-overlay">
                          <span><FiUpload /> Change Photo</span>
                        </div>
                      </>
                    ) : (
                      <div className="picture-placeholder-large">
                        <FiUser size={80} />
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    id="profile-picture-input"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    style={{ display: 'none' }}
                  />

                  <div className="upload-controls">
                    <button
                      type="button"
                      className="upload-button-primary"
                      onClick={() => document.getElementById('profile-picture-input').click()}
                    >
                      <FiUpload /> Choose Photo
                    </button>

                    {(profilePhoto || currentUser.profilePicture) && (
                      <button
                        type="button"
                        className="remove-picture-btn"
                        onClick={() => {
                          setProfilePhoto('');
                          const fileInput = document.getElementById('profile-picture-input');
                          if (fileInput) fileInput.value = '';
                        }}
                      >
                        <FiX /> Remove Photo
                      </button>
                    )}

                    <div className="upload-info">
                      <div className="upload-info-item">
                        <FiCheckCircle />
                        <span>Accepted formats: JPG, PNG, GIF</span>
                      </div>
                      <div className="upload-info-item">
                        <FiCheckCircle />
                        <span>Maximum file size: 5MB</span>
                      </div>
                      <div className="upload-info-item">
                        <FiCheckCircle />
                        <span>Recommended: Square image (1:1 ratio)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-row">
                <div className="form-group">
                  <label><FiUser /> First Name</label>
                  <input
                    type="text"
                    value={editedUser.firstName || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label><FiUser /> Middle Name</label>
                  <input
                    type="text"
                    value={editedUser.middleName || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, middleName: e.target.value })}
                    placeholder="Enter your middle name (optional)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FiUser /> Last Name</label>
                  <input
                    type="text"
                    value={editedUser.surname || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, surname: e.target.value })}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label><FiCalendar /> Date of Birth</label>
                  <input
                    type="date"
                    value={editedUser.birthdate ? new Date(editedUser.birthdate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedUser({ ...editedUser, birthdate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label><FiMail /> Email</label>
                <input
                  type="email"
                  value={editedUser.email || ''}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  title="Email cannot be changed"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FiPhone /> Contact Number</label>
                  <input
                    type="tel"
                    value={editedUser.contactNumber || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, contactNumber: e.target.value })}
                    placeholder="Enter your contact number"
                  />
                </div>
                <div className="form-group">
                  <label><FiUser /> Gender</label>
                  <select
                    value={editedUser.gender || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label><FiMapPin /> Address</label>
                <textarea
                  value={editedUser.address || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                  placeholder="Enter your address"
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setProfilePhoto('');
                    setEditedUser({ ...currentUser });
                  }}
                >
                  <FiX /> Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                >
                  <FiSave /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirmation && (
        <div className="modal-overlay" onClick={cancelLogout}>
          <div className="modal logout-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiLogOut /> Confirm Logout</h2>

            </div>
            <div className="modal-content">
              <p>Are you sure you want to log out?</p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={cancelLogout}
              >
                <FiX /> Cancel
              </button>
              <button
                type="button"
                className="logout-btn-confirm"
                onClick={confirmLogout}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );
};

// Wrap Dashboard with ErrorBoundary and ToastContainer
const DashboardWithProviders = () => (
  <ErrorBoundary>
    <Dashboard />
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
  </ErrorBoundary>
);

export default DashboardWithProviders;
