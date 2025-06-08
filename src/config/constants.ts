// API Configuration
export const API_URL = '';  // Empty string for proxy to work

// Glucose Units
export const GLUCOSE_UNITS = {
  MGDL: 'mg/dL',
  MMOLL: 'mmol/L'
};

// Glucose Range Colors
export const GLUCOSE_COLORS = {
  VERY_LOW: '#d00000',  // Dangerously low
  LOW: '#ffaa00',       // Below target
  NORMAL: '#2ecc71',    // In range
  HIGH: '#ffaa00',      // Above target
  VERY_HIGH: '#d00000'  // Dangerously high
};

// Meal Types
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Insulin Types
export const INSULIN_TYPES = ['Basal', 'Bolus', 'Correction', 'Mixed'];

// Mood Types
export const MOOD_TYPES = ['Excellent', 'Good', 'Neutral', 'Bad', 'Terrible'];

// Date Formats
export const DATE_FORMATS = {
  FULL: 'MMMM d, yyyy h:mm a',
  DATE_ONLY: 'MMMM d, yyyy',
  TIME_ONLY: 'h:mm a'
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#0284c7',
  SECONDARY: '#0d9488',
  ACCENT: '#f59e0b',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  GRAY: '#94a3b8'
};

// Injection Sites
export const INJECTION_SITES = ['Abdomen', 'Thigh', 'Arm', 'Buttock', 'Other', 'Not Specified'];

// Meal Contexts
export const MEAL_CONTEXTS = ['Before Meal', 'After Meal', 'Fasting', 'Bedtime', 'Not Specified'];