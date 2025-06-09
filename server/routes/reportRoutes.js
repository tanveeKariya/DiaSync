// server/routes/reportRoutes.js

import express from 'express';
import asyncHandler from 'express-async-handler'; // For simplified error handling
import { auth } from '../middleware/auth.js'; // Adjust path as necessary (e.g., ../middleware/authMiddleware.js)
import { format } from 'date-fns'; // For date formatting in PDF
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'; // For PDF generation

// --- Mongoose Model Imports ---
// Adjust these paths based on where your model files are located relative to this file.
// For example, if models are in `server/models`, and this file is in `server/routes`, use '../models/'.
import Glucose from '../models/GlucoseReading.js';
import InsulinDose from '../models/InsulinDose.js';
import Meal from '../models/Meal.js';
// import Journal from '../models/Journal.js';
import User from '../models/User.js'; // Import User model to get target glucose range

const router = express.Router();

// Define standard glucose target range for 'Time in Range' calculation
const GLUCOSE_TARGET_MIN = 70; // mg/dL
const GLUCOSE_TARGET_MAX = 180; // mg/dL

/**
 * Helper function to fetch and aggregate report data
 */
const getAggregatedReportData = async (userId, queryStartDate, queryEndDate) => {
  const user = await User.findById(userId).select('name email diabetesType targetGlucoseRange settings');

  const commonQuery = {
    user: userId,
    timestamp: {
      $gte: queryStartDate,
      $lte: queryEndDate,
    },
  };

  // --- 1. Glucose Statistics ---
  const glucoseReadings = await Glucose.find(commonQuery)
    .select('value timestamp')
    .sort({ timestamp: 1 }); // Sort for charting

  const glucoseValues = glucoseReadings.map(g => g.value);

  let glucoseStats = {
    average: 0,
    min: 0,
    max: 0,
    inRangePercentage: 0,
    readings: glucoseReadings, // Include raw readings for frontend charting
    targetMin: user?.targetGlucoseRange?.min || GLUCOSE_TARGET_MIN, // Use user's target or default
    targetMax: user?.targetGlucoseRange?.max || GLUCOSE_TARGET_MAX, // Use user's target or default
  };

  if (glucoseValues.length > 0) {
    const totalGlucose = glucoseValues.reduce((sum, val) => sum + val, 0);
    glucoseStats.average = parseFloat((totalGlucose / glucoseValues.length).toFixed(1));
    glucoseStats.min = Math.min(...glucoseValues);
    glucoseStats.max = Math.max(...glucoseValues);

    const inRangeCount = glucoseValues.filter(
      value => value >= glucoseStats.targetMin && value <= glucoseStats.targetMax
    ).length;
    glucoseStats.inRangePercentage = parseFloat(((inRangeCount / glucoseValues.length) * 100).toFixed(1));
  }

  // --- 2. Insulin Statistics ---
  const insulinDoses = await InsulinDose.find(commonQuery)
    .select('units timestamp')
    .sort({ timestamp: 1 });

  const insulinUnits = insulinDoses.map(d => d.units);

  let insulinStats = {
    totalDoses: insulinDoses.length,
    averageDose: 0,
    doses: insulinDoses, // Include raw doses for frontend charting
  };

  if (insulinUnits.length > 0) {
    const totalUnits = insulinUnits.reduce((sum, val) => sum + val, 0);
    const durationMs = queryEndDate.getTime() - queryStartDate.getTime();
    const durationDays = durationMs / (1000 * 60 * 60 * 24);

    insulinStats.averageDose = durationDays >= 1
      ? parseFloat((totalUnits / durationDays).toFixed(1))
      : parseFloat(totalUnits.toFixed(1)); // If less than a day, average is just total
  }

  // --- 3. Meal Statistics ---
  const meals = await Meal.find(commonQuery)
    .select('totalCarbs timestamp')
    .sort({ timestamp: 1 });

  const mealCarbs = meals.map(m => m.totalCarbs);

  let mealStats = {
    averageCarbs: 0,
    meals: meals, // Include raw meals for frontend charting
  };

  if (mealCarbs.length > 0) {
    const totalCarbs = mealCarbs.reduce((sum, val) => sum + val, 0);
    mealStats.averageCarbs = parseFloat((totalCarbs / mealCarbs.length).toFixed(1));
  }

  // --- 4. Wellness Statistics (from Journal) ---
  const journalQuery = {
      user: userId,
      date: { // Assuming 'date' field in Journal model for the entry's date
          $gte: queryStartDate,
          $lte: queryEndDate,
      },
  };
  const journalEntries = await Journal.find(journalQuery)
    .select('mood stressLevel sleepHours exerciseMinutes date') // Include date for sorting
    .sort({ date: 1 });

  let wellnessStats = {
    averageStress: 0,
    averageSleep: 0,
    moodDistribution: {}, // e.g., { Excellent: 5, Good: 3, Neutral: 2 }
  };

  if (journalEntries.length > 0) {
    const stressLevels = journalEntries.filter(e => e.stressLevel !== undefined && e.stressLevel !== null).map(e => e.stressLevel);
    const sleepHours = journalEntries.filter(e => e.sleepHours !== undefined && e.sleepHours !== null).map(e => e.sleepHours);

    if (stressLevels.length > 0) {
      wellnessStats.averageStress = parseFloat((stressLevels.reduce((sum, val) => sum + val, 0) / stressLevels.length).toFixed(1));
    }
    if (sleepHours.length > 0) {
      wellnessStats.averageSleep = parseFloat((sleepHours.reduce((sum, val) => sum + val, 0) / sleepHours.length).toFixed(1));
    }

    const moodCounts = {};
    journalEntries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });
    wellnessStats.moodDistribution = moodCounts;
  }

  return {
    user: user.toObject(), // Convert Mongoose document to plain object for easier manipulation
    glucoseStats,
    insulinStats,
    mealStats,
    wellnessStats,
  };
};


/**
 * @route GET /api/reports/overview
 * @desc Get aggregated overview data for glucose, insulin, meals, and wellness for a user
 * @access Private (requires authentication)
 */
router.get('/overview', auth, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  // Basic validation for date range
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required for reports.' });
  }

  // Convert dates to proper Date objects for MongoDB queries
  const queryStartDate = new Date(startDate);
  let queryEndDate = new Date(endDate);
  // Ensure the end date includes the entire day
  queryEndDate.setHours(23, 59, 59, 999);

  // Validate dates
  if (isNaN(queryStartDate.getTime()) || isNaN(queryEndDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format provided.' });
  }

  const reportData = await getAggregatedReportData(userId, queryStartDate, queryEndDate);

  res.json(reportData);
}));


/**
 * @route GET /api/reports/export/:format
 * @desc Export aggregated report data as PDF
 * @access Private (requires authentication)
 */
router.get('/export/:format', auth, asyncHandler(async (req, res) => {
  const { format: exportFormat } = req.params;
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required for export.' });
  }

  if (exportFormat !== 'pdf') {
    return res.status(400).json({ message: 'Only PDF export format is supported.' });
  }

  const queryStartDate = new Date(startDate);
  let queryEndDate = new Date(endDate);
  queryEndDate.setHours(23, 59, 59, 999);

  if (isNaN(queryStartDate.getTime()) || isNaN(queryEndDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format provided for export.' });
  }

  const reportData = await getAggregatedReportData(userId, queryStartDate, queryEndDate);

  // --- PDF Generation Logic (using pdf-lib) ---
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let yPos = height - 50;
  const margin = 50;
  const lineHeight = 15;
  const sectionSpacing = 30;
  const subSectionIndent = 20;

  // Colors for text
  const primaryColor = rgb(0.1, 0.5, 0.8); // Blue
  const secondaryColor = rgb(0.98, 0.34, 0.11); // Orange
  const textColor = rgb(0, 0, 0); // Black

  // Header
  page.drawText('Diabetes Management Report', {
    x: margin,
    y: yPos,
    font: fontBold,
    size: 26,
    color: primaryColor,
  });
  yPos -= 35;

  // User Info
  page.drawText(`Name: ${reportData.user.name}`, { x: margin, y: yPos, font, size: 12, color: textColor });
  yPos -= lineHeight;
  page.drawText(`Email: ${reportData.user.email}`, { x: margin, y: yPos, font, size: 12, color: textColor });
  yPos -= lineHeight;
  page.drawText(`Diabetes Type: ${reportData.user.diabetesType || 'N/A'}`, { x: margin, y: yPos, font, size: 12, color: textColor });
  yPos -= lineHeight;
  page.drawText(`Report Period: ${format(queryStartDate, 'MMM dd, yyyy')} - ${format(queryEndDate, 'MMM dd, yyyy')}`, { x: margin, y: yPos, font, size: 12, color: textColor });
  yPos -= sectionSpacing;

  // Glucose Statistics
  page.drawText('Glucose Statistics', { x: margin, y: yPos, font: fontBold, size: 18, color: secondaryColor });
  yPos -= lineHeight + 5;
  page.drawText(`Average Glucose: ${reportData.glucoseStats.average.toFixed(1)} mg/dL`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
  yPos -= lineHeight;
  page.drawText(`Min Glucose: ${reportData.glucoseStats.min} mg/dL`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
  yPos -= lineHeight;
  page.drawText(`Max Glucose: ${reportData.glucoseStats.max} mg/dL`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
  yPos -= lineHeight;
  page.drawText(`Time in Range (${reportData.glucoseStats.targetMin}-${reportData.glucoseStats.targetMax} mg/dL): ${reportData.glucoseStats.inRangePercentage.toFixed(1)}%`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
  yPos -= sectionSpacing;

  // Insulin Statistics
  page.drawText('Insulin Usage', { x: margin, y: yPos, font: fontBold, size: 18, color: secondaryColor });
  yPos -= lineHeight + 5;
  page.drawText(`Total Doses Recorded: ${reportData.insulinStats.totalDoses}`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
  yPos -= lineHeight;
  page.drawText(`Average Daily Dose: ${reportData.insulinStats.averageDose.toFixed(1)} units`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
  yPos -= sectionSpacing;

  // Meal Statistics
  page.drawText('Meal Analysis', { x: margin, y: yPos, font: fontBold, size: 18, color: secondaryColor });
  yPos -= lineHeight + 5;
  page.drawText(`Average Carbohydrates per Meal: ${reportData.mealStats.averageCarbs.toFixed(1)}g`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
  yPos -= sectionSpacing;

  // Wellness Statistics
  page.drawText('Wellness Metrics', { x: margin, y: yPos, font: fontBold, size: 18, color: secondaryColor });
  yPos -= lineHeight + 5;
  page.drawText(`Average Sleep: ${reportData.wellnessStats.averageSleep.toFixed(1)} hours`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
  yPos -= lineHeight;
  page.drawText(`Average Stress Level: ${reportData.wellnessStats.averageStress.toFixed(1)}/10`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
  yPos -= lineHeight;

  const moodEntries = Object.entries(reportData.wellnessStats.moodDistribution);
  if (moodEntries.length > 0) {
    const moodText = moodEntries.map(([mood, count]) => `${mood}: ${count}`).join(', ');
    page.drawText(`Mood Distribution: ${moodText}`, { x: margin + subSectionIndent, y: yPos, font, size: 12, color: textColor });
    yPos -= lineHeight;
  }
  yPos -= sectionSpacing;


  // More detailed data (optional: add pages if necessary)
  // For raw readings/doses, you'd typically paginate or summarize further.
  // Example for Glucose Readings (simple list, you might need pagination logic for many entries)
  if (reportData.glucoseStats.readings.length > 0) {
    page.drawText('Detailed Glucose Readings:', { x: margin, y: yPos, font: fontBold, size: 14, color: primaryColor });
    yPos -= lineHeight + 5;
    reportData.glucoseStats.readings.slice(0, 10).forEach(reading => { // Limit to first 10 for example
      if (yPos < margin) { // Add new page if content overflows
        page = pdfDoc.addPage();
        yPos = height - margin;
        page.drawText('Detailed Glucose Readings (continued):', { x: margin, y: yPos, font: fontBold, size: 14, color: primaryColor });
        yPos -= lineHeight + 5;
      }
      page.drawText(`- ${format(new Date(reading.timestamp), 'MMM dd, yyyy HH:mm')}: ${reading.value} mg/dL`, { x: margin + subSectionIndent, y: yPos, font, size: 10, color: textColor });
      yPos -= lineHeight;
    });
  }


  const pdfBytes = await pdfDoc.save();

  // --- Send PDF as response ---
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="diabetes-report-${format(queryStartDate, 'yyyy-MM-dd')}-to-${format(queryEndDate, 'yyyy-MM-dd')}.pdf"`);
  res.send(Buffer.from(pdfBytes)); // Send the Buffer
}));

export default router;