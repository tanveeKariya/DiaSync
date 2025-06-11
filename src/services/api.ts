// src/services/api.ts

import axios from 'axios';

// --- Interfaces for API Payloads (assuming these match your backend expectations) ---
interface JournalEntryPayload {
  date: string;
  mood: string;
  stressLevel?: number;
  sleepHours?: number;
  exerciseMinutes?: number;
  exerciseType?: string;
  content: string;
  tags?: string[];
}

interface JournalEntryResponse extends JournalEntryPayload {
  _id: string; // Backend usually returns an _id for created/updated entries
  createdAt: string;
  updatedAt: string;
}

const api = axios.create({
  // *** CRITICAL CORRECTION HERE ***
  // Base URL should be ONLY the domain and port.
  // The '/api' prefix will be added in individual API service calls below (e.g., '/api/journal').
  baseURL: 'https://diasync-ez2f.onrender.com',
  timeout: 15000, // Increased timeout slightly for potentially slower network or server responses
});

// Request Interceptor: Adds the Authorization header with the user's token.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request errors (e.g., network issues before sending)
    return Promise.reject(error);
  }
);

// Response Interceptor: Handles common API response errors.
api.interceptors.response.use(
  (response) => response, // If response is successful, just return it
  (error) => {
    // Centralized error handling for specific HTTP status codes
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      const { status } = error.response;

      if (status === 401) {
        console.warn('401 Unauthorized - Token expired or invalid. Redirecting to login...');
        localStorage.removeItem('token'); // Clear the invalid token
        window.location.assign('/login'); // Use window.location.assign for full page reload to clear app state
      } else if (status === 403) {
        console.error('403 Forbidden - User does not have permission.');
      } else if (status === 404) {
        console.error('404 Not Found - The requested resource could not be found.', error.response.config.url);
      } else if (status >= 500) {
        console.error('Server Error (5xx) - Something went wrong on the server.', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response was received (e.g., network down, CORS issue)
      console.error('No response received from server. Network error or CORS issue?', error);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up API request:', error.message);
    }

    // Re-throw the error so that the calling component can also handle it if needed
    return Promise.reject(error);
  }
);

// --- Exported API Services ---
// Each service call should now explicitly include the '/api/' prefix
// because the baseURL no longer has it.

// Glucose API
export const glucoseApi = {
  getReadings: (params?: any) => api.get('/api/glucose', { params }),
  addReading: (data: any) => api.post('/api/glucose', data),
  updateReading: (id: string, data: any) => api.put(`/api/glucose/${id}`, data),
  deleteReading: (id: string) => api.delete(`/api/glucose/${id}`),
  getStats: (params?: any) => api.get('/api/glucose/stats/overview', { params }),
};

// Chatbot API
export const chatbotApi = {
  askBot: (message: string) => api.post('/api/chatbot', { message }),
};

// Meal API
export const mealApi = {
  getMeals: (params?: { page?: number; limit?: number; search?: string; mealType?: string; }) => api.get('/api/meals', { params }),
  addMeal: (data: any) => api.post('/api/meals', data),
  updateMeal: (id: string, data: any) => api.put(`/api/meals/${id}`, data),
  deleteMeal: (id: string) => api.delete(`/api/meals/${id}`),
  getSuggestions: (params?: any) => api.get('/api/meals/suggestions/smart', { params }),
};

// Insulin API
export const insulinApi = {
  getDoses: (params?: { page?: number; limit?: number; search?: string; type?: string }) => api.get('/api/insulin', { params }),
  addDose: (data: any) => api.post('/api/insulin', data),
  updateDose: (id: string, data: any) => api.put(`/api/insulin/${id}`, data),
  deleteDose: (id: string) => api.delete(`/api/insulin/${id}`),
  calculateDose: (data: any) => api.post('/api/insulin/calculate', data),
};

// Journal API - **Refined for Type Safety**
// export const journalApi = {
//   // *** CRITICAL CORRECTION HERE: Add /api/ prefix to match backend's /api/journal mount ***
//   getEntries: (params?: any) => api.get('/api/journal', { params }),
//   addEntry: (data: JournalEntryPayload) => api.post<JournalEntryResponse>('/api/journal', data),
//   updateEntry: (id: string, data: JournalEntryPayload) => api.put<JournalEntryResponse>(`/api/journal/${id}`, data),
//   deleteEntry: (id: string) => api.delete(`/api/journal/${id}`),
//   getTrends: (params?: any) => api.get('/api/journal/stats/trends', { params }),
// };
// If you intended to use a backend model, this code should not be here in the frontend.
// If you want to fetch readings for a user, use the API as below or remove this function.

export const getReadingsForUser = async (userId: string, limit = 50) => {
    try {
        const response = await api.get('/api/glucose', { params: { user: userId, limit } });
        return response.data;
    } catch (error) {
        console.error('Error fetching glucose readings for user:', error);
        throw new Error('Failed to fetch glucose readings.');
    }
};
// Reports API
export const reportsApi = {
  getOverview: (params: { startDate: string; endDate: string }) => {
    return api.get('/api/reports/overview', { params });
  },
  exportData: (format: 'pdf', params: { startDate: string; endDate: string }) => {
    return api.get(`/api/reports/export/${format}`, {
      params,
      responseType: 'blob', // This tells Axios to expect binary data
    });
  },
};

// Profile API
export const profileApi = {
  updateProfile: (data: any) => api.put('/api/auth/profile', data),
  updatePassword: (data: any) => api.put('/api/auth/password', data),
  updateSettings: (data: any) => api.put('/api/auth/settings', data),
};

export default api;