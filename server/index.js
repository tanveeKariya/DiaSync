import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; // Don't forget to 'npm install dotenv' if you haven't
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

// Route imports
import authRoutes from './routes/authRoutes.js';
import glucoseRoutes from './routes/glucoseRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import insulinRoutes from './routes/insulinRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// --- IMPORTANT: Load environment variables ---
// This path assumes your .env file is in the parent directory of 'server'
// (i.e., in the root of your 'project' folder).
// For Render, you will set these variables directly in the Render dashboard.
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // To parse JSON request bodies
app.use(cookieParser()); // To parse cookies

// --- CORS Configuration ---
// Make sure FRONTEND_URL is set in your .env for local dev and in Render's environment variables for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL // Will be your Netlify URL on Render
    : 'http://localhost:5173', // For local frontend development
  credentials: true // Important if you're sending cookies or authentication headers
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/glucose', glucoseRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/insulin', insulinRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/reports', reportRoutes);

// Root route - a simple check to see if the API is running
app.get('/', (req, res) => {
  res.send('DiaSync API is running');
});

// --- Connect to MongoDB ---
// This will now ONLY use the MONGODB_URI environment variable.
// Ensure MONGODB_URI is set correctly in your .env (locally) and Render dashboard (production).
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server ONLY after a successful database connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    // It's good practice to exit the process if the database connection fails
    // as the application cannot function without it.
    process.exit(1);
  });