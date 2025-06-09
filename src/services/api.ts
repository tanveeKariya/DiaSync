// src/services/api.ts

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://diasync-ez2f.onrender.com/api', // Adjust if your backend API is on a different path
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error); // Important: Don't forget to reject on request error
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for 401 (Unauthorized) specifically
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - Token expired or invalid. Redirecting to login...');
      localStorage.removeItem('token'); // Clear invalid token
      // You might want to use a state management solution or a dedicated
      // redirect function to handle this gracefully in a React app.
      // For now, window.location.href works.
      window.location.href = '/login';
    }
    // For other errors, re-throw them so the component can handle them
    return Promise.reject(error);
  }
);

// Glucose API
export const glucoseApi = {
  getReadings: (params?: any) => api.get('/glucose', { params }),
  addReading: (data: any) => api.post('/glucose', data),
  updateReading: (id: string, data: any) => api.put(`/glucose/${id}`, data),
  deleteReading: (id: string) => api.delete(`/glucose/${id}`),
  getStats: (params?: any) => api.get('/glucose/stats/overview', { params }),
};

// Meal API
export const mealApi = {
  getMeals: (params?: any) => api.get('/meals', { params }),
  addMeal: (data: any) => api.post('/meals', data),
  updateMeal: (id: string, data: any) => api.put(`/meals/${id}`, data),
  deleteMeal: (id: string) => api.delete(`/meals/${id}`),
  getSuggestions: (params?: any) => api.get('/meals/suggestions/smart', { params }),
};

// Insulin API (Corrected to match backend expected parameters)
export const insulinApi = {
  // getDoses now expects an object for params, which aligns with the backend
  getDoses: (params?: { page?: number; limit?: number; search?: string; type?: string }) => api.get('/insulin', { params }),
  addDose: (data: any) => api.post('/insulin', data),
  updateDose: (id: string, data: any) => api.put(`/insulin/${id}`, data),
  deleteDose: (id: string) => api.delete(`/insulin/${id}`),
  calculateDose: (data: any) => api.post('/insulin/calculate', data), // Ensure this endpoint exists if used
};

// Journal API
export const journalApi = {
  getEntries: (params?: any) => api.get('/journal', { params }),
  addEntry: (data: any) => api.post('/journal', data),
  updateEntry: (id: string, data: any) => api.put(`/journal/${id}`, data),
  deleteEntry: (id: string) => api.delete(`/journal/${id}`),
  getTrends: (params?: any) => api.get('/journal/stats/trends', { params }),
};

// Reports API
export const reportsApi = {
  getOverview: (params: { startDate: string; endDate: string }) => {
    return api.get('/reports/overview', { params });
  },
  exportData: (format: 'pdf', params: { startDate: string; endDate: string }) => {
    // IMPORTANT: Set responseType to 'blob' for file downloads
    return api.get(`/reports/export/${format}`, {
      params,
      responseType: 'blob', // This tells Axios to expect binary data
    });
  },
};

// Profile API
export const profileApi = {
  updateProfile: (data: any) => api.put('/auth/profile', data),
  updatePassword: (data: any) => api.put('/auth/password', data),
  updateSettings: (data: any) => api.put('/auth/settings', data),
};

export default api;