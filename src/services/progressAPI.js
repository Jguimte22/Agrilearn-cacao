import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, try the demo endpoint for guest users
      if (error.config.url === '/progress') {
        return api.get('/progress-demo');
      }
    }
    return Promise.reject(error);
  }
);

// Progress tracking APIs
export const progressAPI = {
  // Get user's course progress
  getProgress: async (courseId = null) => {
    const url = courseId ? `/progress?courseId=${courseId}` : '/progress';
    const response = await api.get(url);
    return response.data;
  },

  // Complete a lesson
  completeLesson: async (courseId, lessonId, lessonTitle) => {
    const response = await api.post('/progress/complete-lesson', {
      courseId,
      lessonId,
      lessonTitle
    });
    return response.data;
  },

  // Recalculate progress to fix cached data
  recalculateProgress: async () => {
    const response = await api.post('/progress/recalculate-progress');
    return response.data;
  },

  // Update lesson completion (legacy endpoint)
  completeLessonLegacy: async (courseId, lessonId, data = {}) => {
    const response = await api.post(`/progress/${courseId}/lesson/${lessonId}`, data);
    return response.data;
  },

  // Get course statistics
  getStats: async () => {
    const response = await api.get('/progress/stats');
    return response.data;
  },

  // Get certificates
  getCertificates: async () => {
    const response = await api.get('/progress/certificates');
    return response.data;
  },

  // Get single certificate
  getCertificate: async (certificateId) => {
    const response = await api.get(`/certificates/${certificateId}`);
    return response.data;
  },

  // Verify certificate (public)
  verifyCertificate: async (certificateId) => {
    const response = await api.get(`/verify/${certificateId}`);
    return response.data;
  }
};

// Achievement APIs
export const achievementAPI = {
  // Get all achievements
  getAchievements: async () => {
    const response = await api.get('/achievements/');
    return response.data;
  },

  // Get user's achievements
  getUserAchievements: async () => {
    const response = await api.get('/achievements/user');
    return response.data;
  },

  // Get achievement progress
  getAchievementProgress: async (achievementId) => {
    const response = await api.get(`/achievements/progress/${achievementId}`);
    return response.data;
  },

  // Setup default achievements
  setupAchievements: async () => {
    const response = await api.post('/achievements/setup');
    return response.data;
  },

  // Get achievement statistics
  getAchievementStats: async () => {
    const response = await api.get('/achievements/stats');
    return response.data;
  },

  // Check and unlock achievements based on user progress
  checkProgress: async () => {
    const response = await api.post('/achievements/check-progress');
    return response.data;
  }
};

// Notification APIs
export const notificationAPI = {
  // Get notifications
  getNotifications: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    const response = await api.get(url);
    return response.data;
  },

  // Create notification (for testing)
  createNotification: async (notificationData) => {
    const response = await api.post('/notifications/create', notificationData);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Get notification count
  getNotificationCount: async () => {
    const response = await api.get('/notifications/count');
    return response.data;
  }
};

// Progress utilities
export const progressUtils = {
  // Calculate progress percentage
  calculateProgress: (completedLessons, totalLessons) => {
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  },

  // Format time spent
  formatTimeSpent: (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  },

  // Get progress status
  getProgressStatus: (progress) => {
    if (progress === 0) return 'Not Started';
    if (progress < 100) return 'In Progress';
    return 'Completed';
  }
};

export default {
  progressAPI,
  achievementAPI,
  notificationAPI,
  progressUtils
};
