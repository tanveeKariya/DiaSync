import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- Interface for the User Object (must match your backend User model) ---
interface User {
  _id: string;
  name: string;
  email: string;
  diabetesType: string;
  dateOfDiagnosis?: string; // Optional because it might not be set initially
  insulinType?: { // Optional, can be null/undefined if not set
    basal?: string;
    bolus?: string;
  };
  targetGlucoseRange?: { // Optional, can be null/undefined if not set
    min?: number;
    max?: number;
  };
  emergencyContacts?: Array<{ // Optional, can be empty array if no contacts
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  }>;
  doctor?: { // Optional, can be null/undefined if not set
    name?: string;
    phone?: string;
    email?: string;
    accessCode?: string;
  };
  settings?: { // Optional, can be null/undefined if not set
    glucoseUnit?: string;
    darkMode?: boolean;
    notificationsEnabled?: boolean;
  };
  createdAt?: string; // Optional, Mongoose timestamps
  updatedAt?: string; // Optional, Mongoose timestamps
}

// --- Interface for the AuthContext Type ---
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: any) => Promise<void>;
  toggleTheme: (isDark: boolean) => void; // Added for theme toggling
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// --- Configure Axios Base URL ---
// It's generally better to set this once in an axios config file
// or directly here if this is your primary axios usage.
axios.defaults.baseURL = 'https://diasync-ez2f.onrender.com/api'; // Ensure this matches your backend API prefix (e.g., /api)
axios.defaults.headers.post['Content-Type'] = 'application/json';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Initialize as false
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true for initial load

  // --- Theme Toggling Logic ---
  // Using useCallback to prevent unnecessary re-renders
  const toggleTheme = useCallback((isDark: boolean) => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', JSON.stringify(isDark));
  }, []);

  // --- Effect to set Axios Authorization header when token changes ---
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // --- Effect to fetch user data on initial load or token change ---
  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setIsLoading(true); // Start loading before API call
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const res = await axios.get('/auth/me'); // Endpoint is /api/auth/me
          const userData = res.data; // Backend sends the full user object directly

          // If dateOfDiagnosis is a Date object or string from backend,
          // ensure it's formatted for the frontend <input type="date">
          if (userData.dateOfDiagnosis) {
            userData.dateOfDiagnosis = new Date(userData.dateOfDiagnosis).toISOString().split('T')[0];
          }

          setUser(userData);
          setToken(storedToken);
          setIsAuthenticated(true);

          // Apply dark mode setting if available in user preferences
          const storedDarkMode = localStorage.getItem('darkMode'); // Check local storage first
          if (userData.settings?.darkMode !== undefined) {
             toggleTheme(userData.settings.darkMode);
          } else if (storedDarkMode !== null) { // If not in user settings, but in local storage
            toggleTheme(JSON.parse(storedDarkMode));
          } else {
             toggleTheme(false); // Default to light mode
          }

        } catch (error) {
          console.error('Authentication check failed:', error);
          // If token is invalid or fetching fails, clear auth state
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
          toggleTheme(false); // Reset theme on auth failure
        } finally {
          setIsLoading(false); // Finish loading regardless of outcome
        }
      } else {
        // No token found, so not authenticated, stop loading
        setIsLoading(false);
        setIsAuthenticated(false);
        toggleTheme(false); // Default to light if no user or token
      }
    };
    fetchUser();
  }, [toggleTheme]); // Re-run if toggleTheme changes (though it's useCallback, so it won't)


  // --- Login Function ---
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post('/auth/login', { email, password }); // Endpoint is /api/auth/login
      const receivedToken = res.data.token;
      const userData = res.data.user; // Backend sends the full user object

      localStorage.setItem('token', receivedToken);
      setToken(receivedToken); // This will trigger the useEffect to set Axios header

      // Format date for frontend
      if (userData.dateOfDiagnosis) {
        userData.dateOfDiagnosis = new Date(userData.dateOfDiagnosis).toISOString().split('T')[0];
      }

      setUser(userData);
      setIsAuthenticated(true);

      if (userData.settings?.darkMode !== undefined) {
        toggleTheme(userData.settings.darkMode);
      } else {
        toggleTheme(false); // Default to light for newly logged-in user if no setting
      }

    } catch (error) {
      console.error('Login failed:', error);
      // It's good practice to re-throw the error so calling components can catch it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // --- Register Function ---
  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      console.log("Register Payload:", userData);

      const res = await axios.post('/auth/register', userData); // Endpoint is /api/auth/register
      const receivedToken = res.data.token;
      const newUser = res.data.user; // Backend sends the full new user object

      localStorage.setItem('token', receivedToken);
      setToken(receivedToken); // This will trigger the useEffect to set Axios header

      // Format date for frontend
      if (newUser.dateOfDiagnosis) {
        newUser.dateOfDiagnosis = new Date(newUser.dateOfDiagnosis).toISOString().split('T')[0];
      }

      setUser(newUser);
      setIsAuthenticated(true);
      toggleTheme(false); // Default to light mode for new registrations

    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // --- Logout Function ---
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toggleTheme(false); // Reset theme to default on logout
    // Optionally redirect to login page if you have react-router-dom
    // history.push('/login');
  };

  // --- Update Profile Function ---
  const updateProfile = async (userData: any) => {
    setIsLoading(true);
    try {
      const res = await axios.put('/auth/profile', userData); // Endpoint is /api/auth/profile
      const updatedUser = res.data.user; // Backend sends the updated full user object

      // Format date for frontend
      if (updatedUser.dateOfDiagnosis) {
        updatedUser.dateOfDiagnosis = new Date(updatedUser.dateOfDiagnosis).toISOString().split('T')[0];
      }

      setUser(updatedUser);

      // Apply theme change if settings were updated
      if (updatedUser.settings?.darkMode !== undefined) {
        toggleTheme(updatedUser.settings.darkMode);
      }

    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, isLoading, login, register, logout, updateProfile, toggleTheme }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};