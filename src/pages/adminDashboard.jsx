import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome, FiUsers, FiBook, FiMessageSquare,
  FiSettings, FiHelpCircle, FiLogOut, FiSearch,
  FiDollarSign, FiShoppingBag, FiHeadphones, FiUser,
  FiTrendingUp, FiActivity, FiBarChart2, FiCalendar,
  FiDownload, FiPlus, FiFilter, FiRefreshCw, FiEdit,
  FiTrash2, FiX, FiSave, FiMail, FiShield, FiSend, FiEye,
  FiAward, FiTarget, FiClock, FiCheckCircle, FiCircle,
  FiAlertCircle
} from 'react-icons/fi';
import OTPDisplay from '../components/OTPDisplay';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement
} from 'chart.js';
import './adminDashboard.css';
import { API_BASE_URL as baseApi } from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  // Helper functions for achievement styling
  const getAchievementCategoryColor = (category) => {
    const colors = {
      'course_completion': '#27ae60',
      'quiz_score': '#3498db',
      'streak': '#e74c3c',
      'time_spent': '#f39c12',
      'social': '#9b59b6',
      'special': '#e67e22'
    };
    return colors[category] || '#95a5a6';
  };

  const getAchievementCategoryLabel = (category) => {
    const labels = {
      'course_completion': 'Courses',
      'quiz_score': 'Quizzes',
      'streak': 'Streak',
      'time_spent': 'Time',
      'social': 'Social',
      'special': 'Special'
    };
    return labels[category] || 'General';
  };

  const getAchievementRarityColor = (rarity) => {
    const colors = {
      'common': '#95a5a6',
      'uncommon': '#27ae60',
      'rare': '#3498db',
      'epic': '#9b59b6',
      'legendary': '#f39c12'
    };
    return colors[rarity] || '#95a5a6';
  };

  // Courses state
  const [courses, setCourses] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    modules: '',
    image: '',
    imageFile: null,
    imagePreview: null,
    level: 'Beginner',
    status: 'active'
  });

  // Users state
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedUserProgress, setSelectedUserProgress] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [currentUser, setCurrentUser] = useState({
    name: '',
    email: '',
    role: 'user',
    password: ''
  });

  // Mock user progress data - replace with actual API call
  const [userProgress, setUserProgress] = useState({
    coursesCompleted: 0,
    totalCourses: 12,
    totalScore: 0,
    maxScore: 100,
    achievements: [],
    lastActive: new Date().toISOString(),
    performance: {
      quizzes: { completed: 0, averageScore: 0 },
      assignments: { completed: 0, averageScore: 0 },
      activities: { completed: 0, participation: 0 }
    }
  });

  // User details state
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  // Fetch user progress data
  const fetchUserProgress = async (userId, userName, userProfilePicture = null, userRole = null) => {
    try {
      console.log('🔍 Starting fetchUserProgress for:', { userId, userName, userProfilePicture, userRole });
      const token = getToken();
      console.log('🔑 Token available:', token ? 'Yes' : 'No');

      // Try the actual route with authentication
      console.log('📊 Trying actual route with authentication...');
      console.log('📊 Request URL:', `${baseApi}/admin/users/${userId}/progress`);
      console.log('📊 Request headers:', { 'Authorization': `Bearer ${token?.substring(0, 20)}...` });

      const response = await fetch(`${baseApi}/admin/users/${userId}/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response statusText:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('📊 User progress data received:', data.data);

          // Transform the API data to match the expected structure
          const transformedData = {
            coursesCompleted: data.data.courses?.completed || 0,
            totalCourses: data.data.courses?.total || 0,
            coursesStarted: data.data.courses?.inProgress || 0,
            coursesNotStarted: data.data.courses?.notStarted || 0,
            totalScore: data.data.scores?.total || 0,
            maxScore: data.data.scores?.maxScore || 100,
            quizScores: data.data.quizScores || [],
            achievements: data.data.achievements || [],
            lastActive: data.data.lastActive || new Date().toISOString(),
            performance: data.data.performance || {
              quizzes: { completed: 0, averageScore: 0 },
              assignments: { completed: 0, averageScore: 0 },
              activities: { completed: 0, participation: 0 }
            },
            monthlyProgress: data.data.monthlyProgress || [],
            recentActivity: data.data.recentActivity || [],
            certificates: data.data.certificates || { earned: 0, totalAvailable: 0 },
            timeSpent: data.data.timeSpent || { total: 0, averagePerCourse: 0 },
            userInfo: data.data.user || { name: userName, email: '', profilePicture: userProfilePicture, userRole: userRole },
            userProfilePicture: userProfilePicture || data.data.user?.profilePicture || null,
            userRole: userRole || data.data.user?.userRole || null
          };

          // Calculate actual average score from quiz scores if available
          const quizScoresList = transformedData.quizScores || [];
          if (quizScoresList.length > 0) {
            const totalScore = quizScoresList.reduce((sum, quiz) => {
              const score = typeof quiz.score === 'number' ? quiz.score :
                (typeof quiz.percentage === 'number' ? quiz.percentage : 0);
              return sum + score;
            }, 0);
            const avgScore = Math.round(totalScore / quizScoresList.length);

            console.log('📊 Calculated Average Score:', avgScore, 'from', quizScoresList.length, 'quizzes');

            // Ensure performance object exists and update it
            if (!transformedData.performance) {
              transformedData.performance = { quizzes: {}, assignments: {}, activities: {} };
            }
            if (!transformedData.performance.quizzes) {
              transformedData.performance.quizzes = {};
            }
            transformedData.performance.quizzes.averageScore = avgScore;
            transformedData.performance.quizzes.completed = quizScoresList.length;
          }

          setUserProgress(transformedData);
          console.log('✅ User progress data loaded successfully');
          console.log('🔍 Quiz Scores received from API:', data.data.quizScores);
          console.log('🔍 Quiz Scores in transformed data:', transformedData.quizScores);
          console.log('🔍 Recent activity data:', transformedData.recentActivity);
          console.log('🔍 Recent activity length:', transformedData.recentActivity?.length || 0);

          // TEMPORARY: Add test data if no recent activity exists
          if (!transformedData.recentActivity || transformedData.recentActivity.length === 0) {
            console.log('🧪 Adding test course progress data in frontend...');
            transformedData.recentActivity = [
              {
                courseId: 'cacao-basics',
                course: 'Cacao Basics',
                category: 'Fundamentals',
                progress: 100,
                score: 85,
                lastUpdated: new Date(),
                completed: true,
                timeSpent: 120,
                lessonsCompleted: 4,
                totalLessons: 4,
                quizzesTaken: 2,
                certificateEarned: true,
                enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                lastAccessedAt: new Date()
              },
              {
                courseId: 'planting-techniques',
                course: 'Planting Techniques',
                category: 'Agriculture',
                progress: 100,
                score: 92,
                lastUpdated: new Date(),
                completed: true,
                timeSpent: 150,
                lessonsCompleted: 4,
                totalLessons: 4,
                quizzesTaken: 3,
                certificateEarned: true,
                enrolledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                lastAccessedAt: new Date()
              }
            ];
            console.log('🧪 Test data added in frontend. Recent activity count:', transformedData.recentActivity.length);
          }

          // Log quiz scores received from backend
          console.log('✅ Quiz scores from API. Count:', transformedData.quizScores?.length || 0);
          console.log('✅ Quiz scores data:', transformedData.quizScores);
        } else {
          console.error('❌ API returned no success:', data);
          // Show error state instead of mock data
          setUserProgress({
            coursesCompleted: 0,
            totalCourses: 0,
            coursesStarted: 0,
            coursesNotStarted: 0,
            totalScore: 0,
            maxScore: 100,
            quizScores: [],
            achievements: [],
            lastActive: new Date().toISOString(),
            performance: {
              quizzes: { completed: 0, averageScore: 0 },
              assignments: { completed: 0, averageScore: 0 },
              activities: { completed: 0, participation: 0 }
            },
            monthlyProgress: [],
            recentActivity: [],
            certificates: { earned: 0, totalAvailable: 0 },
            timeSpent: { total: 0, averagePerCourse: 0 },
            userInfo: { name: userName, email: '' },
            error: 'No progress data available'
          });
        }
      } else {
        console.error('❌ API call failed:', response.status, response.statusText);
        // Show error state instead of mock data
        setUserProgress({
          coursesCompleted: 0,
          totalCourses: 0,
          coursesStarted: 0,
          coursesNotStarted: 0,
          totalScore: 0,
          maxScore: 100,
          quizScores: [],
          achievements: [],
          lastActive: new Date().toISOString(),
          performance: {
            quizzes: { completed: 0, averageScore: 0 },
            assignments: { completed: 0, averageScore: 0 },
            activities: { completed: 0, participation: 0 }
          },
          monthlyProgress: [],
          recentActivity: [],
          certificates: { earned: 0, totalAvailable: 0 },
          timeSpent: { total: 0, averagePerCourse: 0 },
          userInfo: { name: userName, email: '' },
          error: 'Failed to fetch progress data'
        });
      }

      setSelectedUserProgress(userId);
      setSelectedUserName(userName);
      setActiveTab('user-progress');
    } catch (error) {
      console.error('❌ API call failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        userId: userId
      });

      // Set error state for UI display
      setUserProgress({
        error: error.message || 'Failed to fetch user progress data',
        coursesCompleted: 0,
        totalCourses: 0,
        coursesStarted: 0,
        coursesNotStarted: 0,
        totalScore: 0,
        maxScore: 100,
        quizScores: [],
        achievements: [],
        lastActive: new Date().toISOString(),
        performance: {
          quizzes: { completed: 0, averageScore: 0, highestScore: 0, lowestScore: 0, totalAvailable: 0 },
          assignments: { completed: 0, averageScore: 0, highestScore: 0, lowestScore: 0, totalAvailable: 0 },
          overall: { averageScore: 0, rank: 'N/A', improvement: 0 }
        },
        monthlyProgress: [],
        recentActivity: []
      });

      setSelectedUserProgress(userId);
      setSelectedUserName(userName);
      setActiveTab('user-progress');
    }
  };

  // Handle view user details
  const handleViewUserDetails = (user) => {
    setSelectedUserDetails(user);
    setShowUserDetailsModal(true);
  };

  // Messages state
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyData, setReplyData] = useState({ subject: '', message: '' });
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'messages') {
      fetchMessages();
    } else if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  
  const getToken = () => localStorage.getItem('token') || localStorage.getItem('adminToken') || sessionStorage.getItem('token') || sessionStorage.getItem('adminToken');

  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = () => {
    // Clear all tokens from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');

    // Clear all tokens from sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('adminToken');

    // Clear any other user-related data
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');

    // Navigate to login page
    navigate('/login');
  };

  // Image mapping to match course names with actual files
  const customImageMap = {
    'Cacao Basics': '/CacaoBacics.png',
    'Planting Techniques': '/PlantingBg.png',
    'Harvest & Processing': '/CacaoHarvest.png',
    'Pest & Disease Management': '/PestDisease.png',
    'Types of Cloning in Cacao': '/Cloning.png',
    'Care Management': '/CareManagement.png',
    'GAP (Good Agricultural Practices)': '/GAP.png'
  };

  // Helper function to get correct image path with retry logic
  const getImagePath = (imageName, courseTitle = null) => {
    if (!imageName) return '/CacaoBacics.png'; // Use local default image

    // Check if it's already a full HTTP URL
    if (imageName.startsWith('http')) return imageName;

    // Check if it's an uploaded image (starts with /images/courses/)
    if (imageName.startsWith('/images/courses/')) return imageName;

    // Check if we have a mapping for this course title
    if (courseTitle && customImageMap[courseTitle]) {
      return customImageMap[courseTitle];
    }

    // If it already starts with /, use it as-is
    if (imageName.startsWith('/')) return imageName;

    // Otherwise add leading slash
    return '/' + imageName;
  };

  // Simple image component without complex retry logic
  const CourseImage = ({ course }) => {
    const [imageSrc, setImageSrc] = useState(() => getImagePath(course.image, course.title));
    const [hasError, setHasError] = useState(false);

    const handleImageError = (e) => {
      console.log('=== Image Load Failed ===');
      console.log('Course image:', course.image);
      console.log('Course title:', course.title);
      console.log('Mapped path:', getImagePath(course.image, course.title));
      console.log('Current src:', e.target.src);
      console.log('Natural width:', e.target.naturalWidth);
      console.log('Natural height:', e.target.naturalHeight);

      // Test direct loading
      const testImg = new Image();
      testImg.onload = () => {
        console.log('Direct load successful - this suggests a React rendering issue');
      };
      testImg.onerror = () => {
        console.log('Direct load also failed - this suggests a server/path issue');
      };
      testImg.src = getImagePath(course.image, course.title);

      // Fallback to default
      setHasError(true);
      e.target.src = '/CacaoBacics.png';
    };

    const handleImageLoad = (e) => {
      console.log('=== Image Load Success ===');
      console.log('Course image:', course.image);
      console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
      setHasError(false);
    };

    return (
      <img
        src={imageSrc}
        alt={course.title}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{
          opacity: hasError ? 0.7 : 1,
          border: hasError ? '2px solid #dc3545' : 'none',
          borderRadius: '8px'
        }}
      />
    );
  };

  // ============ DASHBOARD FUNCTIONS ============
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const [usersRes, coursesRes, messagesRes] = await Promise.all([
        fetch(`${baseApi}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseApi}/courses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseApi}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const usersData = await usersRes.json();
      const coursesData = await coursesRes.json();
      const messagesData = await messagesRes.json();

      const usersList = usersData.data || [];
      const coursesList = coursesData.data || [];
      const messagesList = messagesData.data || [];

      // Calculate specific stats
      const unreadMessagesCount = messagesList.filter(m => !m.read).length;
      const uniqueCategories = [...new Set(coursesList.map(c => c.category))].length;

      // Generate activities from users (New User Joined)
      const activities = usersList
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(user => ({
          id: user._id,
          user: user.fullName || user.name || 'Unknown User',
          action: 'joined the community',
          time: new Date(user.createdAt).toLocaleDateString(),
          status: 'completed'
        }));

      setData({
        stats: {
          courses: coursesList.length,
          farmers: usersList.length,
          unreadMessages: unreadMessagesCount,
          categories: uniqueCategories
        },
        activities
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============ COURSES FUNCTIONS ============
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${baseApi}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        console.log('=== Courses Data from Server ===');
        console.log('Raw courses data:', result.data);
        result.data.forEach((course, index) => {
          console.log(`Course ${index + 1}:`, {
            _id: course._id,
            id: course.id,
            title: course.title,
            category: course.category,
            duration: course.duration,
            modules: course.modules,
            image: course.image
          });
        });
        setCourses(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    setIsEditingCourse(false);
    setCurrentCourse({
      title: '',
      description: '',
      category: '',
      duration: '',
      modules: '',
      image: '',
      imageFile: null,
      imagePreview: null,
      level: 'Beginner',
      status: 'active'
    });
    setShowCourseModal(true);
  };

  const handleEditCourse = (course) => {
    console.log('=== Edit Course Called ===');
    console.log('Original course data:', course);
    console.log('Course _id:', course._id);
    console.log('Course id:', course.id);
    console.log('ID type:', typeof course._id);
    console.log('Is MongoDB ID:', course._id && course._id.match(/^[0-9a-fA-F]{24}$/));

    setIsEditingCourse(true);
    // Ensure all required fields are properly initialized
    const courseData = {
      _id: course._id,
      id: course.id,
      title: course.title || '',
      description: course.description || '',
      category: course.category || 'Beginner',
      duration: course.duration || '',
      modules: course.modules || 1,
      image: course.image || '',
      imageFile: null,
      imagePreview: null,
      level: course.level || 'Beginner',
      status: course.status || 'active'
    };

    console.log('Setting course data for editing:', courseData);
    setCurrentCourse(courseData);
    setShowCourseModal(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${baseApi}/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setCourses(courses.filter(c => c._id !== courseId));
        alert('Course deleted successfully!');
      } else {
        alert('Failed to delete course');
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Error deleting course');
    }
  };

  // Remove test function since we fixed the main issue


  const handleSaveCourse = async (e) => {
    e.preventDefault();

    try {
      const token = getToken();
      const url = isEditingCourse
        ? `${baseApi}/courses/${currentCourse._id}`
        : `${baseApi}/courses`;

      const method = isEditingCourse ? 'PUT' : 'POST';

      // Log the data being sent for debugging
      console.log('=== Course Save Request ===');
      console.log('Is editing:', isEditingCourse);
      console.log('Course ID:', currentCourse._id);
      console.log('Request URL:', url);
      console.log('Request method:', method);
      console.log('Token exists:', !!token);
      console.log('Token:', token ? token.substring(0, 20) + '...' : 'missing');
      console.log('Sending course data:', currentCourse);
      console.log('Has image file:', !!currentCourse.imageFile);

      // Validate required fields before sending
      const requiredFields = ['title', 'description', 'category', 'duration'];
      const missingFields = requiredFields.filter(field =>
        !currentCourse ||
        !currentCourse[field] ||
        (typeof currentCourse[field] === 'string' && currentCourse[field].trim() === '') ||
        (typeof currentCourse[field] === 'number' && isNaN(currentCourse[field]))
      );

      // Special validation for modules field (must be a positive number)
      if (!currentCourse.modules || isNaN(currentCourse.modules) || currentCourse.modules < 1) {
        missingFields.push('modules');
      }

      if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      let response;

      // Always use FormData for consistency
      console.log('Using FormData for course creation');

      // Create FormData for file upload
      const formData = new FormData();

      // Add all course fields except file objects
      Object.keys(currentCourse).forEach(key => {
        if (key !== 'imageFile' && key !== 'imagePreview') {
          const value = currentCourse[key];
          if (value !== undefined && value !== null) {
            console.log(`Adding ${key}:`, value);
            formData.append(key, value);
          }
        }
      });

      // Add the image file if it exists
      if (currentCourse.imageFile) {
        console.log('Uploading image file:', currentCourse.imageFile.name);
        formData.append('image', currentCourse.imageFile);
      } else {
        console.log('No image file to upload, will use default');
      }

      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // Debug: Log all FormData entries
      console.log('=== FormData Contents ===');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type when using FormData
        },
        body: formData
      });

      const result = await response.json();
      console.log('=== Server Response ===');
      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);
      console.log('Server response:', result);
      console.log('Response success:', result.success);

      if (result.success) {
        if (isEditingCourse) {
          console.log('=== Updating Course in State ===');
          console.log('Current courses before update:', courses);
          console.log('Updated course from server:', result.data);

          // Update the course in the state
          const updatedCourses = courses.map(c => {
            if (c._id === currentCourse._id) {
              console.log('Found course to update:', c.title);
              console.log('Replacing with:', result.data);
              return result.data;
            }
            return c;
          });

          console.log('Courses after update:', updatedCourses);
          setCourses(updatedCourses);

          // Also refresh the courses from server to ensure consistency
          setTimeout(() => {
            console.log('Refreshing courses from server...');
            fetchCourses();
          }, 500);

          alert('Course updated successfully!');
        } else {
          setCourses([...courses, result.data]);
          console.log('New course data:', result.data);
          console.log('New course image:', result.data.image);
          alert('Course created successfully!');
        }
        setShowCourseModal(false);
      } else {
        console.error('=== Server Error ===');
        console.error('Error message:', result.error);
        console.error('Full response:', result);
        alert(result.error || result.message || 'Failed to save course');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Error saving course: ' + err.message);
    }
  };

  const handleCourseInputChange = (e) => {
    const { name, value, files } = e.target;

    console.log('=== Input Change Event ===');
    console.log('Input name:', name);
    console.log('Has files:', !!files);
    console.log('Files length:', files ? files.length : 0);
    console.log('Value:', value);

    if (name === 'image' && files && files[0]) {
      const file = files[0];
      console.log('=== Image File Selected ===');
      console.log('File name:', file.name);
      console.log('File type:', file.type);
      console.log('File size:', file.size, 'bytes');
      console.log('Last modified:', file.lastModifiedDate);
      console.log('File object:', file);

      setCurrentCourse(prev => ({
        ...prev,
        image: file.name,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    } else if (name !== 'image') {
      setCurrentCourse(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // ============ USERS FUNCTIONS ============
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`${baseApi}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data || []);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setIsEditingUser(false);
    setCurrentUser({
      name: '',
      email: '',
      role: 'user',
      password: ''
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setIsEditingUser(true);
    setCurrentUser({
      ...user,
      password: '' // Don't show password
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${baseApi}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setUsers(users.filter(u => u._id !== userId));
        alert('User deleted successfully!');
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Error deleting user');
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    try {
      const token = getToken();
      const url = isEditingUser
        ? `${baseApi}/admin/users/${currentUser._id}`
        : `${baseApi}/users/register`;

      const method = isEditingUser ? 'PUT' : 'POST';

      // Don't send password if editing and password is empty
      const userData = { ...currentUser };
      if (isEditingUser && !userData.password) {
        delete userData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (result.success) {
        if (isEditingUser) {
          setUsers(users.map(u => u._id === currentUser._id ? result.data : u));
          alert('User updated successfully!');
        } else {
          setUsers([...users, result.data]);
          alert('User created successfully!');
        }
        setShowUserModal(false);
      } else {
        alert(result.message || 'Failed to save user');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Error saving user');
    }
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({ ...prev, [name]: value }));
  };

  // ============ MESSAGES FUNCTIONS ============
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || sessionStorage.getItem('token') || sessionStorage.getItem('adminToken');
      const response = await fetch(`${baseApi}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) setMessages(result.data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId, currentStatus) => {
    if (currentStatus) return;
    try {
      const token = getToken();
      await fetch(`${baseApi}/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messages.map(msg => (msg._id === messageId ? { ...msg, read: true } : msg)));
      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage({ ...selectedMessage, read: true });
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const token = getToken();
      await fetch(`${baseApi}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messages.filter(msg => msg._id !== messageId));
      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleOpenReply = (msg) => {
    setReplyData({ subject: `Re: ${msg.subject}`, message: '' });
    setShowReplyModal(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    setSendingReply(true);
    try {
      const token = getToken();
      const response = await fetch(`${baseApi}/messages/${selectedMessage._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: replyData.subject, replyMessage: replyData.message })
      });
      const result = await response.json();
      if (result.success) {
        alert('Reply sent successfully');
        setShowReplyModal(false);
      } else {
        alert(result.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Error sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [3000, 4000, 3500, 5000, 4800, 6000],
        borderColor: '#6e4622',
        backgroundColor: 'rgba(110, 70, 34, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Users',
        data: [2000, 3000, 2500, 4000, 3800, 5000],
        borderColor: '#FFC107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
      x: { grid: { display: false } }
    },
    maintainAspectRatio: false,
  };

  // ============ RENDER USER PROGRESS SECTION ============
  const renderUserProgress = () => {
    if (!selectedUserProgress) {
      return (
        <div className="admin-main-content">
          <div className="admin-content">
            <div className="admin-welcome-section">
              <div>
                <h1 className="admin-welcome">User Progress</h1>
                <p className="admin-welcome-subtitle">View detailed progress and performance metrics for selected users</p>
              </div>
            </div>
            <div className="admin-no-results">
              <FiActivity size={48} />
              <p>No user selected. Go to the Users tab and click "View Progress" on any user to see their detailed progress.</p>
            </div>
          </div>
        </div>
      );
    }

    // Check if there's an error state
    if (userProgress.error) {
      return (
        <div className="admin-main-content">
          <div className="admin-content">
            <div className="admin-welcome-section">
              <div>
                <h1 className="admin-welcome">{selectedUserName}'s Progress</h1>
                <p className="admin-welcome-subtitle">Unable to load progress data</p>
              </div>
            </div>
            <div className="admin-no-results" style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '40px' }}>
              <FiAlertCircle size={48} style={{ color: '#e53e3e', marginBottom: '15px' }} />
              <h3 style={{ color: '#e53e3e', marginBottom: '10px' }}>Unable to Load Progress Data</h3>
              <p style={{ color: '#666', marginBottom: '15px' }}>{userProgress.error}</p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                This user may not have any course activity yet, or there might be a connection issue.
                Try refreshing the page or check if the user has enrolled in any courses.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Chart data for performance
    const performanceChartData = {
      labels: userProgress.monthlyProgress.map(m => m.month),
      datasets: [
        {
          label: 'Overall Score',
          data: userProgress.monthlyProgress.map(m => m.score),
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#2ecc71',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Activities Completed',
          data: userProgress.monthlyProgress.map(m => m.activities),
          borderColor: '#f1c40f',
          backgroundColor: 'rgba(241, 196, 15, 0.2)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#f1c40f',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y1'
        }
      ]
    };

    const performanceChartOptions = {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
        axis: 'x'
      },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#2c3e50',
          bodyColor: '#2c3e50',
          borderColor: '#eee',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4
        },
        title: {
          display: false,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: { color: '#95a5a6' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { display: false },
          beginAtZero: true,
          ticks: { color: '#95a5a6' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#95a5a6' }
        }
      },
      maintainAspectRatio: false,
    };

    // Course status data for pie chart
    const courseStatusData = {
      labels: ['Completed', 'In Progress', 'Not Started'],
      datasets: [{
        data: [
          userProgress.coursesCompleted,
          userProgress.coursesStarted,
          userProgress.coursesNotStarted
        ],
        backgroundColor: ['#2ecc71', '#FFC107', '#e74c3c'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    const courseStatusOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      },
      maintainAspectRatio: false,
    };

    // Enhanced Quiz scores data for bar chart with better labels and performance colors
    console.log('🔍 Debugging quiz scores data:', userProgress.quizScores);

    const quizScoresData = {
      labels: userProgress.quizScores && userProgress.quizScores.length > 0
        ? userProgress.quizScores.map((quiz, i) => {
          // Use quiz name if available, otherwise use quiz number
          console.log(`🔍 Processing quiz ${i}:`, quiz);
          return quiz.quizName || quiz.name || `Quiz ${i + 1}`;
        })
        : ['No Quiz Data'],
      datasets: [{
        label: 'Score (%)',
        data: userProgress.quizScores && userProgress.quizScores.length > 0
          ? userProgress.quizScores.map(quiz => {
            const score = quiz.score || quiz.percentage || 0;
            console.log(`🔍 Extracted score:`, score, 'from quiz:', quiz);
            return score;
          })
          : [0],
        backgroundColor: userProgress.quizScores && userProgress.quizScores.length > 0
          ? userProgress.quizScores.map(quiz => {
            const score = quiz.score || quiz.percentage || 0;
            // Color coding based on performance
            if (score >= 80) return 'rgba(46, 204, 113, 0.7)'; // Green for excellent
            if (score >= 60) return 'rgba(255, 193, 7, 0.7)'; // Yellow for good
            return 'rgba(231, 76, 60, 0.7)'; // Red for needs improvement
          })
          : 'rgba(149, 165, 166, 0.5)',
        borderColor: userProgress.quizScores && userProgress.quizScores.length > 0
          ? userProgress.quizScores.map(quiz => {
            const score = quiz.score || quiz.percentage || 0;
            if (score >= 80) return '#27ae60';
            if (score >= 60) return '#f39c12';
            return '#e74c3c';
          })
          : '#95a5a6',
        borderWidth: 2,
        borderRadius: 5,
        borderSkipped: false,
      }]
    };

    console.log('🔍 Final quiz scores data:', quizScoresData);

    const quizScoresOptions = {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 0,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const score = context.parsed.y;
              let performance = '';
              if (score >= 80) performance = ' (Excellent!)';
              else if (score >= 60) performance = ' (Good)';
              else performance = ' (Needs Improvement)';

              return `Score: ${score}%${performance}`;
            },
            afterLabel: function (context) {
              if (userProgress.quizScores && userProgress.quizScores.length > 0) {
                const quiz = userProgress.quizScores[context.dataIndex];
                if (quiz.completedAt) {
                  return `Completed: ${new Date(quiz.completedAt).toLocaleDateString()}`;
                }
                if (quiz.date) {
                  return `Completed: ${new Date(quiz.date).toLocaleDateString()}`;
                }
              }
              return '';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Score (%)',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            callback: function (value) {
              return value + '%';
            },
            maxTicksLimit: 6
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            },
            autoSkip: false
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      layout: {
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      }
    };

    return (
      <div className="admin-main-content">
        <div className="admin-content">
          <div className="admin-welcome-section">
            <div>
              <h1 className="admin-welcome">{selectedUserName}'s Progress</h1>
              <p className="admin-welcome-subtitle">Detailed performance overview and achievements</p>
            </div>
            <div className="admin-date-selector">
              <FiClock className="admin-date-icon" />
              <span>Last active: {new Date(userProgress.lastActive).toLocaleDateString()}</span>
            </div>
          </div>

          {/* User Info Card */}
          <div className="admin-user-info-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {userProgress.userProfilePicture ? (
                <div className="admin-user-avatar" style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundImage: userProgress.userProfilePicture ? `url(${baseApi.replace('/api', '')}${userProgress.userProfilePicture})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                </div>
              ) : (
                <div className="admin-user-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6e4622, #8b5a3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
                  {selectedUserName.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <h2 style={{ margin: '0', color: '#2c3e50', fontSize: '24px' }}>{selectedUserName}</h2>
                  {userProgress.userRole && (
                    <span className="admin-user-badge" style={{
                      background: userProgress.userRole === 'farmer' ? 'rgba(139, 90, 43, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                      color: userProgress.userRole === 'farmer' ? '#8B5A2B' : '#3498db',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <FiUser size={12} /> {userProgress.userRole}
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>Last active: {new Date(userProgress.lastActive).toLocaleDateString()} at {new Date(userProgress.lastActive).toLocaleTimeString()}</p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span className="admin-user-badge" style={{ background: 'rgba(46, 204, 113, 0.15)', color: '#27ae60', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    {userProgress.coursesCompleted} Courses Completed
                  </span>
                  <span className="admin-user-badge" style={{ background: 'rgba(255, 193, 7, 0.15)', color: '#f39c12', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    {userProgress.performance.quizzes.averageScore}% Avg Score
                  </span>
                  <span className="admin-user-badge" style={{ background: 'rgba(110, 70, 34, 0.15)', color: '#6e4622', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    {userProgress.achievements.length} Achievements
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Overall Progress</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6e4622' }}>
                  {Math.round((userProgress.coursesCompleted / userProgress.totalCourses) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Course Status Cards */}
          <div className="admin-stats-grid" style={{ marginBottom: '30px' }}>
            <div className="admin-stat-card" style={{ borderLeftColor: '#2ecc71' }}>
              <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' }}>
                <FiCheckCircle />
              </div>
              <div className="admin-stat-details">
                <h3 className="admin-stat-title">Course Completed</h3>
                <p className="admin-stat-value">{userProgress.coursesCompleted}</p>
                <span className="admin-stat-change">Out of {userProgress.totalCourses} courses</span>
              </div>
            </div>

            <div className="admin-stat-card" style={{ borderLeftColor: '#FFC107' }}>
              <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)', color: '#FFC107' }}>
                <FiTarget />
              </div>
              <div className="admin-stat-details">
                <h3 className="admin-stat-title">Course Progress</h3>
                <p className="admin-stat-value">{userProgress.coursesStarted || 0}</p>
                <span className="admin-stat-change">Currently in progress</span>
              </div>
            </div>

            <div className="admin-stat-card" style={{ borderLeftColor: '#e74c3c' }}>
              <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' }}>
                <FiCircle />
              </div>
              <div className="admin-stat-details">
                <h3 className="admin-stat-title">Course Not Started</h3>
                <p className="admin-stat-value">{userProgress.coursesNotStarted}</p>
                <span className="admin-stat-change">Available to start</span>
              </div>
            </div>

            <div className="admin-stat-card" style={{ borderLeftColor: '#6e4622' }}>
              <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(110, 70, 34, 0.15)', color: '#6e4622' }}>
                <FiAward />
              </div>
              <div className="admin-stat-details">
                <h3 className="admin-stat-title">Quiz Score</h3>
                <p className="admin-stat-value">{userProgress.performance.quizzes.averageScore}%</p>
                <span className="admin-stat-change">Average score</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="admin-charts-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
            <div className="admin-chart-container" style={{ flex: '2 1 400px', minWidth: '300px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Overall Performance</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                {userProgress.monthlyProgress && userProgress.monthlyProgress.length > 0 ? (
                  <Line
                    key={`performance-chart-${selectedUserProgress}`}
                    data={performanceChartData}
                    options={performanceChartOptions}
                  />
                ) : (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <FiBarChart2 size={48} style={{ marginBottom: '15px', opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No performance data available yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-chart-container" style={{ flex: '1 1 300px', minWidth: '250px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Course Status</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Doughnut
                  key={`course-status-chart-${selectedUserProgress}`}
                  data={courseStatusData}
                  options={courseStatusOptions}
                />
              </div>
            </div>
          </div>

          {/* Detailed Course Progress */}
          <div className="admin-detailed-progress" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiBook /> Completed Courses
            </h3>
            <div className="admin-course-progress-list">
              {userProgress.recentActivity && userProgress.recentActivity.filter(a => a.completed || a.progress >= 100).length > 0 ? (
                userProgress.recentActivity
                  .filter(activity => activity.completed || activity.progress >= 100)
                  .map((activity, index) => (
                    <div key={index} className="admin-course-progress-item" style={{
                      padding: '15px',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <div className="admin-course-progress-icon" style={{
                        width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', color: 'white',
                        backgroundColor: '#27ae60'
                      }}>
                        ✓
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 6px 0', color: '#2c3e50', fontSize: '16px', fontWeight: '700' }}>
                          {activity.course || 'Untitled Course'}
                        </h4>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#666' }}>
                          <span style={{ color: '#27ae60', fontWeight: '500' }}>Completed</span>
                          {activity.score > 0 && (
                            <span>Score: {Math.round(activity.score)}%</span>
                          )}
                          {activity.timeSpent > 0 && (
                            <span>Time: {Math.round(activity.timeSpent)}min</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {new Date(activity.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  <p>No completed courses yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quiz Scores Cards */}
          <div className="admin-quiz-scores-section" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiCheckCircle /> Recent Quiz Scores
            </h3>
            {userProgress.quizScores && userProgress.quizScores.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '15px'
              }}>
                {userProgress.quizScores.map((quiz, index) => {
                  const score = quiz.score || quiz.percentage || 0;
                  const getScoreColor = (score) => {
                    if (score >= 80) return '#27ae60';
                    if (score >= 60) return '#f39c12';
                    return '#e74c3c';
                  };

                  return (
                    <div key={index} style={{
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                      border: '1px solid #e9ecef',
                      borderRadius: '10px',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: `${getScoreColor(score)}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getScoreColor(score),
                        fontSize: '20px',
                        flexShrink: 0
                      }}>
                        <FiCheckCircle />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '4px'
                        }}>
                          {quiz.quizName || quiz.name || `Quiz ${index + 1}`}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          Score: <span style={{
                            color: getScoreColor(score),
                            fontWeight: '700',
                            fontSize: '16px'
                          }}>{score}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#999',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <FiCheckCircle size={48} style={{ marginBottom: '15px', opacity: 0.3 }} />
                <p style={{ margin: 0 }}>No quiz scores available yet.</p>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="admin-achievements">
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>User Achievements</h3>
            {userProgress.achievements && userProgress.achievements.length > 0 ? (
              <div className="admin-achievements-section">
                <div className="admin-achievements-header">
                  <h3><FiAward /> User Achievements</h3>
                </div>

                <div className="admin-achievements-grid">
                  {userProgress.achievements.map((achievement, index) => (
                    <div key={achievement.id || achievement._id || index} className="admin-achievement-card">
                      <div className="admin-achievement-icon-wrapper">
                        {/* Render icon based on type or category */}
                        {(() => {
                          const icon = achievement.icon;
                          // If icon is an emoji (simple check), display it
                          if (icon && /\p{Emoji}/u.test(icon)) {
                            return <span style={{ fontSize: '2rem' }}>{icon}</span>;
                          }

                          // Otherwise map category/name to React Icons
                          const categoryIcons = {
                            'course_completion': <FiBook size={32} />,
                            'quiz_score': <FiCheckCircle size={32} />,
                            'streak': <FiTrendingUp size={32} />,
                            'time_spent': <FiClock size={32} />,
                            'social': <FiUsers size={32} />,
                            'special': <FiAward size={32} />
                          };

                          return categoryIcons[achievement.category] || <FiAward size={32} />;
                        })()}
                      </div>

                      <div className="admin-achievement-title">
                        {achievement.name || 'Achievement'}
                      </div>

                      <div className="admin-achievement-desc">
                        {achievement.description || 'Great accomplishment!'}
                      </div>

                      <div className="admin-achievement-meta">
                        <div className="admin-achievement-badge" style={{
                          background: getAchievementCategoryColor(achievement.category),
                          color: 'white'
                        }}>
                          {getAchievementCategoryLabel(achievement.category)}
                        </div>

                        <div style={{
                          color: getAchievementRarityColor(achievement.rarity),
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          fontSize: '0.7rem'
                        }}>
                          {achievement.rarity || 'common'}
                        </div>
                      </div>

                      {(achievement.points || achievement.unlockedAt) && (
                        <div style={{
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid #f0f0f0',
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem'
                        }}>
                          {achievement.points && (
                            <span className="admin-achievement-points">
                              ⭐ {achievement.points} pts
                            </span>
                          )}
                          {achievement.unlockedAt && (
                            <span className="admin-achievement-date">
                              {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'white',
                padding: '60px 40px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                textAlign: 'center',
                color: '#666'
              }}>
                <FiAward size={64} style={{ marginBottom: '20px', opacity: 0.4, color: '#ddd' }} />
                <h4 style={{ margin: '0 0 10px 0', color: '#999', fontWeight: '500' }}>No achievements earned yet</h4>
                <p style={{ fontSize: '14px', marginTop: '8px', color: '#aaa', lineHeight: '1.5' }}>
                  User needs to complete more courses, quizzes, or learning activities to unlock achievements
                </p>
                <div style={{
                  marginTop: '20px',
                  padding: '12px 20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  💡 Tip: Achievements are automatically unlocked based on course completion, quiz scores, and learning milestones
                </div>
              </div>
            )}
          </div>

          {/* Learning Insights */}
          <div className="admin-learning-insights" style={{ marginTop: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Learning Insights</h3>
            <div className="admin-insights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="admin-insight-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#27ae60' }}>
                    <FiTrendingUp />
                  </div>
                  <div>
                    <h4 style={{ margin: '0', color: '#2c3e50', fontSize: '16px' }}>Learning Pace</h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Course completion rate</p>
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60', marginBottom: '8px' }}>
                  {userProgress.coursesCompleted > 0 ? Math.round(userProgress.coursesCompleted / Math.max(1, userProgress.coursesStarted) * 100) : 0}%
                </div>
                <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                  {userProgress.coursesCompleted} of {userProgress.coursesStarted} started courses completed
                </p>
              </div>

              <div className="admin-insight-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 193, 7, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f39c12' }}>
                    <FiTarget />
                  </div>
                  <div>
                    <h4 style={{ margin: '0', color: '#2c3e50', fontSize: '16px' }}>Quiz Performance</h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Average quiz score</p>
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12', marginBottom: '8px' }}>
                  {userProgress.performance.quizzes.averageScore}%
                </div>
                <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                  {userProgress.performance.quizzes.completed} quizzes completed
                </p>
              </div>

              <div className="admin-insight-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(110, 70, 34, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e4622' }}>
                    <FiClock />
                  </div>
                  <div>
                    <h4 style={{ margin: '0', color: '#2c3e50', fontSize: '16px' }}>Study Activity</h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Last engagement</p>
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6e4622', marginBottom: '8px' }}>
                  {Math.max(1, Math.floor((Date.now() - new Date(userProgress.lastActive)) / (1000 * 60 * 60 * 24)))} days ago
                </div>
                <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                  Last active on {new Date(userProgress.lastActive).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============ RENDER USERS SECTION ============
  const renderUsers = () => (
    <div className="admin-main-content">
      <div className="admin-content">
        <div className="admin-welcome-section">
          <div>
            <h1 className="admin-welcome">Users Management</h1>
            <p className="admin-welcome-subtitle">Manage all registered users</p>
          </div>

        </div>

        {loading ? (
          <div className="admin-loading">Loading users...</div>
        ) : error ? (
          <div className="admin-error">{error}</div>
        ) : (
          <div className="admin-users-grid">
            {users.map((user) => (
              <div key={user._id} className="admin-user-card">
                {user.profilePicture ? (
                  <div className="admin-user-avatar-large" style={{
                    backgroundImage: user.profilePicture ? `url(${baseApi.replace('/api', '')}${user.profilePicture})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    fontSize: '0'
                  }}>
                  </div>
                ) : (
                  <div className="admin-user-avatar-large">
                    {(user.fullName || user.name)?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="admin-user-details">
                  <h3 className="admin-user-name">{user.fullName || user.name || 'Unknown'}</h3>
                  <p className="admin-user-email">
                    <FiMail size={14} /> {user.email}
                  </p>
                  <div className="admin-user-meta">
                    <span className={`admin-user-role ${user.role === 'admin' ? 'admin' : 'user'}`}>
                      <FiShield size={12} /> {user.role || 'user'}
                    </span>
                    <span className={`admin-user-badge ${user.userRole === 'farmer' ? 'farmer-badge' : 'student-badge'}`} style={{
                      background: user.userRole === 'farmer' ? 'rgba(139, 90, 43, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                      color: user.userRole === 'farmer' ? '#8B5A2B' : '#3498db',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      <FiUser size={11} /> {user.userRole || 'N/A'}
                    </span>
                    <span className="admin-user-status active">Active</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="admin-user-actions">
                  <button
                    className="admin-icon-btn view-progress"
                    onClick={() => fetchUserProgress(user._id, user.fullName || user.name || 'Unknown', user.profilePicture, user.userRole)}
                    title="View Progress"
                  >
                    <FiActivity />
                  </button>
                  <button
                    className="admin-icon-btn view-details"
                    onClick={() => handleViewUserDetails(user)}
                    title="View Details"
                  >
                    <FiEye />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Progress Card - Removed popup */}
        {/* {selectedUserProgress && (
          <div className="admin-user-progress-overlay">
            {renderUserProgressCard()}
          </div>
        )} */}

        {users.length === 0 && !loading && (
          <div className="admin-no-results">
            <FiUsers size={48} />
            <p>No users found. Click "Add User" to create one.</p>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2>{isEditingUser ? 'Edit User' : 'Add New User'}</h2>
                <button className="admin-close-modal" onClick={() => setShowUserModal(false)}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleSaveUser} className="admin-course-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={currentUser.name}
                    onChange={handleUserInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={currentUser.email}
                    onChange={handleUserInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      name="role"
                      value={currentUser.role}
                      onChange={handleUserInputChange}
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Password {isEditingUser && '(leave blank to keep current)'}</label>
                    <input
                      type="password"
                      name="password"
                      value={currentUser.password}
                      onChange={handleUserInputChange}
                      placeholder={isEditingUser ? "Leave blank to keep current" : "Enter password"}
                      required={!isEditingUser}
                    />
                  </div>
                </div>

                <div className="admin-modal-actions">
                  <button type="button" className="admin-btn-cancel" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn-save">
                    <FiSave /> {isEditingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetailsModal && selectedUserDetails && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2>User Details</h2>
                <button className="admin-close-modal" onClick={() => setShowUserDetailsModal(false)}>
                  <FiX />
                </button>
              </div>
              <div className="admin-user-details-content">
                <div className="admin-user-detail-header">
                  {selectedUserDetails.profilePicture ? (
                    <div className="admin-user-detail-avatar" style={{
                      backgroundImage: selectedUserDetails.profilePicture ? `url(${baseApi.replace('/api', '')}${selectedUserDetails.profilePicture})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      fontSize: '0'
                    }}>
                    </div>
                  ) : (
                    <div className="admin-user-detail-avatar">
                      {(selectedUserDetails.fullName || selectedUserDetails.name)?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="admin-user-detail-info">
                    <h3>{selectedUserDetails.fullName || selectedUserDetails.name || 'Unknown User'}</h3>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <span className={`admin-user-role-badge ${selectedUserDetails.role === 'admin' ? 'admin' : 'user'}`}>
                        <FiShield size={14} /> {selectedUserDetails.role || 'user'}
                      </span>
                      <span className={`admin-user-role-badge ${selectedUserDetails.userRole === 'farmer' ? 'farmer-badge' : 'student-badge'}`} style={{
                        background: selectedUserDetails.userRole === 'farmer' ? 'rgba(139, 90, 43, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                        color: selectedUserDetails.userRole === 'farmer' ? '#8B5A2B' : '#3498db',
                        border: selectedUserDetails.userRole === 'farmer' ? '1px solid #8B5A2B' : '1px solid #3498db',
                        textTransform: 'capitalize'
                      }}>
                        <FiUser size={14} /> {selectedUserDetails.userRole || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="admin-user-detail-sections">
                  <div className="admin-detail-section">
                    <h4>Contact Information</h4>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">
                        <FiMail size={14} /> Email
                      </span>
                      <span className="admin-detail-value">{selectedUserDetails.email}</span>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4>Account Information</h4>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">
                        <FiUser size={14} /> User Type
                      </span>
                      <span className="admin-detail-value" style={{ textTransform: 'capitalize' }}>
                        {selectedUserDetails.userRole || 'Not specified'}
                      </span>
                    </div>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">
                        <FiCalendar size={14} /> Joined Date
                      </span>
                      <span className="admin-detail-value">
                        {new Date(selectedUserDetails.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">
                        <FiUser size={14} /> User ID
                      </span>
                      <span className="admin-detail-value">{selectedUserDetails._id}</span>
                    </div>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">
                        <FiCheckCircle size={14} /> Status
                      </span>
                      <span className="admin-detail-value admin-status-active">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ============ RENDER COURSES SECTION ============
  const renderCourses = () => (
    <div className="admin-main-content">
      <div className="admin-content">
        <div className="admin-welcome-section">
          <div>
            <h1 className="admin-welcome">Courses Management</h1>
            <p className="admin-welcome-subtitle">Manage all courses and content</p>
          </div>
          <button className="admin-add-btn" onClick={handleAddCourse}>
            <FiPlus /> Add Course
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">Loading courses...</div>
        ) : error ? (
          <div className="admin-error">{error}</div>
        ) : (
          <div className="admin-courses-grid">
            {courses.map((course, index) => (
              <div key={course._id || index} className="admin-course-card">
                <div className="admin-course-image">
                  <CourseImage course={course} />
                </div>
                <div className="admin-course-content">
                  <div className="admin-course-category">{course.category || 'General'}</div>
                  <h3 className="admin-course-title">{course.title}</h3>
                  <p className="admin-course-desc">{course.description}</p>
                  <div className="admin-course-meta">
                    <span>⏱ {course.duration || 'N/A'}</span>
                    <span>📊 {course.level || 'Beginner'}</span>
                  </div>
                  <div className="admin-course-actions">
                    <button className="admin-icon-btn edit" onClick={() => handleEditCourse(course)}>
                      <FiEdit />
                    </button>
                    <button className="admin-icon-btn delete" onClick={() => handleDeleteCourse(course._id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {courses.length === 0 && !loading && (
          <div className="admin-no-results">
            <FiBook size={48} />
            <p>No courses found. Click "Add Course" to create one.</p>
          </div>
        )}

        {/* Course Modal */}
        {showCourseModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2>{isEditingCourse ? 'Edit Course' : 'Add New Course'}</h2>
                <button className="admin-close-modal" onClick={() => setShowCourseModal(false)}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleSaveCourse} className="admin-course-form">
                <div className="form-group">
                  <label>Course Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={currentCourse.title}
                    onChange={handleCourseInputChange}
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={currentCourse.category}
                      onChange={handleCourseInputChange}
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      name="duration"
                      value={currentCourse.duration}
                      onChange={handleCourseInputChange}
                      placeholder="e.g., 4 weeks"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Modules *</label>
                    <input
                      type="number"
                      name="modules"
                      value={currentCourse.modules}
                      onChange={handleCourseInputChange}
                      placeholder="e.g., 4"
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Course Image {isEditingCourse ? '(optional - leave unchanged to keep current)' : '*'}</label>
                    <input
                      type="file"
                      name="image"
                      onChange={handleCourseInputChange}
                      accept="image/*"
                      required={!isEditingCourse}
                    />
                    <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                      {isEditingCourse
                        ? 'Upload a new image to replace the current one, or leave unchanged to keep existing image'
                        : 'Upload an image file (PNG, JPG, etc.) - Max size: 5MB'
                      }
                    </small>
                    {currentCourse.imagePreview && (
                      <div style={{ marginTop: '1rem' }}>
                        <img
                          src={currentCourse.imagePreview}
                          alt="Course preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            border: '1px solid #ddd'
                          }}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                          {isEditingCourse ? 'New image preview:' : 'Preview:'} {currentCourse.image}
                        </p>
                      </div>
                    )}
                    {!currentCourse.imagePreview && isEditingCourse && currentCourse.image && (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                          Current image:
                        </div>
                        <CourseImage course={currentCourse} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={currentCourse.description}
                    onChange={handleCourseInputChange}
                    placeholder="Enter course description"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Level</label>
                    <select
                      name="level"
                      value={currentCourse.level}
                      onChange={handleCourseInputChange}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={currentCourse.status}
                      onChange={handleCourseInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="coming-soon">Coming Soon</option>
                    </select>
                  </div>
                </div>

                <div className="admin-modal-actions">
                  <button type="button" className="admin-btn-cancel" onClick={() => setShowCourseModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn-save">
                    <FiSave /> {isEditingCourse ? 'Update Course' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ============ RENDER MESSAGES SECTION ============
  const renderMessages = () => (
    <div className="admin-main-content">
      <div className="admin-messages-layout">
        <div className="admin-messages-list-panel">
          <div className="admin-messages-header">
            <h2>Inbox</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              {messages.filter(m => !m.read).length} unread messages
            </p>
          </div>
          <div className="admin-messages-list">
            {messages.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No messages
              </p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg._id}
                  className={`admin-message-item ${!msg.read ? 'unread' : ''} ${selectedMessage?._id === msg._id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMessage(msg);
                    handleMarkAsRead(msg._id, msg.read);
                  }}
                >
                  <div className="admin-msg-header">
                    <span className="admin-msg-sender">{msg.sender}</span>
                    <span className="admin-msg-date">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="admin-msg-subject">{msg.subject}</div>
                  <div className="admin-msg-preview">{msg.content}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-message-detail">
          {selectedMessage ? (
            <>
              <div className="admin-detail-header">
                <div className="admin-detail-meta">
                  <div className="admin-detail-sender">
                    <div className="admin-sender-avatar">
                      {selectedMessage.sender.charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-sender-info">
                      <h4>{selectedMessage.sender}</h4>
                      <span>{selectedMessage.senderEmail}</span>
                    </div>
                  </div>
                  <div className="admin-detail-actions">
                    <button
                      className="admin-icon-btn reply"
                      onClick={() => handleOpenReply(selectedMessage)}
                      title="Reply"
                    >
                      <FiSend />
                    </button>
                    <button
                      className="admin-icon-btn delete"
                      onClick={() => handleDeleteMessage(selectedMessage._id)}
                      title="Delete Message"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <h3 className="admin-detail-subject" style={{ marginTop: '20px' }}>
                  {selectedMessage.subject}
                </h3>
                <p style={{ color: '#999', fontSize: '0.9rem' }}>
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="admin-detail-body">{selectedMessage.content}</div>
            </>
          ) : (
            <div className="admin-empty-message">
              <FiMessageSquare
                size={48}
                style={{ marginBottom: '15px', opacity: 0.5 }}
              />
              <h3>Select a message to read</h3>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Reply to Message</h2>
              <button
                className="admin-close-modal"
                onClick={() => setShowReplyModal(false)}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSendReply} className="admin-course-form">
              <div className="form-group">
                <label>To</label>
                <div
                  className="admin-readonly-field"
                  style={{
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}
                >
                  {selectedMessage?.senderEmail}
                </div>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={replyData.subject}
                  onChange={(e) =>
                    setReplyData({ ...replyData, subject: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={replyData.message}
                  onChange={(e) =>
                    setReplyData({ ...replyData, message: e.target.value })
                  }
                  rows="6"
                  required
                  placeholder="Type your reply here..."
                />
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => setShowReplyModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-save"
                  disabled={sendingReply}
                >
                  <FiSend /> {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ============ RENDER DASHBOARD ============
  const renderDashboard = () => (
    <div className="admin-main-content">
      <header className="admin-top-header">
        <div className="admin-search-bar">
          <FiSearch className="admin-search-icon" />
          <input type="text" placeholder="Search..." className="admin-search-input" />
        </div>
        <div className="admin-user-profile">
          <div className="admin-user-avatar"><FiUser /></div>
          <span className="admin-user-email">admin@example.com</span>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-welcome-section">
          <div>
            <h1 className="admin-welcome">Welcome back, <span className="admin-highlight">Admin!</span></h1>
            <p className="admin-welcome-subtitle">Here's what's happening with your platform today.</p>
          </div>
          <div className="admin-date-selector">
            <FiCalendar className="admin-date-icon" />
            <span>Last 30 days</span>
            <FiFilter className="admin-filter-icon" />
          </div>
        </div>

        <div className="admin-stats-grid">
          {[
            { title: 'Total Courses', value: data?.stats?.courses || '0', icon: <FiBook />, change: 'Available Content', trend: 'up', color: '#6e4622' },
            { title: 'Registered Farmers', value: data?.stats?.farmers || '0', icon: <FiUsers />, change: 'Active Learners', trend: 'up', color: '#4CAF50' },
            { title: 'Unread Messages', value: data?.stats?.unreadMessages || '0', icon: <FiMessageSquare />, change: 'Needs Attention', trend: 'down', color: '#FF5722' },
            { title: 'Categories', value: data?.stats?.categories || '0', icon: <FiFilter />, change: 'Course Topics', trend: 'up', color: '#2196F3' }
          ].map((stat, index) => (
            <div key={index} className="admin-stat-card" style={{ borderLeftColor: stat.color }}>
              <div className="admin-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="admin-stat-details">
                <h3 className="admin-stat-title">{stat.title}</h3>
                <p className="admin-stat-value">{stat.value}</p>
                <span className={`admin-stat-change ${stat.trend}`}>
                  {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-chart-section">
          <div className="admin-chart-header">
            <h2>Recent Activities</h2>
          </div>
          <div className="admin-activities-list">
            {data?.activities?.length > 0 ? (
              data.activities.map((activity) => (
                <div key={activity.id} className="admin-activity-item">
                  <div className={`admin-activity-status ${activity.status}`}></div>
                  <div className="admin-activity-content">
                    <p className="admin-activity-text">
                      <strong>{activity.user}</strong> {activity.action}
                    </p>
                    <span className="admin-activity-time">{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-no-activities">No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUsers();
      case 'courses':
        return renderCourses();
      case 'messages':
        return renderMessages();
      case 'user-progress':
        return renderUserProgress();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-dashboard">
      {/* OTP Display Component */}
      <OTPDisplay />

      <div className="admin-sidebar">
        <div className="admin-logo">Admin Panel</div>
        <nav className="admin-nav-menu">
          {[
            { id: 'dashboard', icon: <FiHome />, label: 'Dashboard' },
            { id: 'users', icon: <FiUsers />, label: 'Users' },
            { id: 'user-progress', icon: <FiActivity />, label: 'User Progress' },
            { id: 'courses', icon: <FiBook />, label: 'Courses' },
            { id: 'messages', icon: <FiMessageSquare />, label: 'Messages' }
          ].map(item => (
            <div
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'admin-active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </div>
          ))}
          <div className="admin-nav-item admin-logout" onClick={handleLogout}>
            <span className="admin-nav-icon"><FiLogOut /></span>
            <span className="admin-nav-label">Logout</span>
          </div>
        </nav>
      </div>

      {renderContent()}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="admin-modal-overlay" onClick={() => setShowLogoutConfirmation(false)}>
          <div className="admin-modal admin-logout-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2><FiLogOut /> Confirm Logout</h2>

            </div>
            <div className="admin-modal-content">
              <p>Are you sure you want to log out?</p>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-cancel" onClick={() => setShowLogoutConfirmation(false)}>
                <FiX /> Cancel
              </button>
              <button className="admin-btn-logout-confirm" onClick={confirmLogout}>
                <FiLogOut /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
