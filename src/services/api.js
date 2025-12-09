const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  console.log('Token retrieval:', { 
    hasLocalStorageToken: !!localStorage.getItem('token'),
    hasSessionStorageToken: !!sessionStorage.getItem('token'),
    token: token ? 'exists' : 'missing'
  });
  return token;
};

// Helper function for authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['x-auth-token'] = token;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
};

// Courses API
export const fetchCourses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses`);
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    const data = await response.json();
    return data.data; // Return the array of courses
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const fetchCourseById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch course with id ${id}`);
    }
    const data = await response.json();
    return data.data; // Return the course object
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
};

// Notifications API
export const fetchNotifications = async () => {
  try {
    const response = await fetchWithAuth('/notifications');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await fetchWithAuth(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Certificates API
export const fetchCertificates = async () => {
  try {
    const response = await fetchWithAuth('/certificates');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
};

export const downloadCertificate = async (certificateId) => {
  try {
    const response = await fetchWithAuth(`/certificates/${certificateId}/download`);
    return response.data;
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw error;
  }
};

// Achievements API
export const fetchAchievements = async () => {
  try {
    const response = await fetchWithAuth('/achievements');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};

export const updateAchievementProgress = async (achievementId, progress) => {
  return fetchWithAuth(`/achievements/${achievementId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ progress })
  });
};

// User Activity API
export const fetchUserActivity = async () => {
  // Check if token exists before making the request
  const token = getAuthToken();
  if (!token) {
    console.log('No auth token available - skipping user activity fetch');
    throw new Error('No token, authorization denied');
  }

  try {
    const response = await fetchWithAuth('/users/activity');
    return response; // Return the response directly
  } catch (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }
};

// Badge Views API
export const getBadgeViews = async () => {
  const token = getAuthToken();
  if (!token) {
    console.log('No auth token available - skipping badge views fetch');
    throw new Error('No token, authorization denied');
  }

  try {
    const response = await fetchWithAuth('/users/badge-views');
    return response.badgeViews;
  } catch (error) {
    console.error('Error fetching badge views:', error);
    throw error;
  }
};

export const updateBadgeViews = async (badgeViews) => {
  const token = getAuthToken();
  if (!token) {
    console.log('No auth token available - skipping badge views update');
    throw new Error('No token, authorization denied');
  }

  try {
    const response = await fetchWithAuth('/users/badge-views', {
      method: 'PUT',
      body: JSON.stringify(badgeViews)
    });
    return response.badgeViews;
  } catch (error) {
    console.error('Error updating badge views:', error);
    throw error;
  }
};
