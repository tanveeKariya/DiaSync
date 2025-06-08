import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
const { GoogleGenerativeAI } = require('@google/generative-ai');
// Route imports
import authRoutes from './routes/authRoutes.js';
import glucoseRoutes from './routes/glucoseRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import insulinRoutes from './routes/insulinRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import reportRoutes from './routes/reportRoutes.js'; 
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables!');
  // Consider throwing an error or exiting if the key is critical
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/glucose', glucoseRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/insulin', insulinRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/reports', reportRoutes);
// Root route
app.get('/', (req, res) => {
  res.send('DiaSync API is running');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/diasync')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
module.exports = genAI;