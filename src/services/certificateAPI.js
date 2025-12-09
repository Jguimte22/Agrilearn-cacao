import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const certificateAPI = {
  // Get all certificates for the current user
  getCertificates: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/certificates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('certificateAPI - API response:', response);
      console.log('certificateAPI - Certificates data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('certificateAPI - Error fetching certificates:', error);
      console.error('certificateAPI - Error response:', error.response?.data);
      throw error;
    }
  },

  // Create a new certificate
  createCertificate: async (certificateData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/certificates`, certificateData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('certificateAPI - Certificate created:', response.data);
      return response.data;
    } catch (error) {
      console.error('certificateAPI - Error creating certificate:', error);
      throw error;
    }
  },

  // Delete a certificate
  deleteCertificate: async (certificateId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/certificates/${certificateId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('certificateAPI - Certificate deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('certificateAPI - Error deleting certificate:', error);
      throw error;
    }
  },

  // Create certificates for all completed courses
  createForCompleted: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/certificates/create-for-completed`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('certificateAPI - Certificates created for completed courses:', response.data);
      return response.data;
    } catch (error) {
      console.error('certificateAPI - Error creating certificates for completed:', error);
      throw error;
    }
  },

  // Download certificate as PDF
  downloadCertificate: async (courseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/certificates/download/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        },
        responseType: 'blob' // Important for PDF download
      });

      console.log('certificateAPI - Certificate PDF downloaded');
      return response.data;
    } catch (error) {
      console.error('certificateAPI - Error downloading certificate:', error);
      throw error;
    }
  }
};

export default certificateAPI;
