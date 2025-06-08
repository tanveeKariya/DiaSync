// server/routes/insulinRoutes.js

import express from 'express';
import asyncHandler from 'express-async-handler'; // npm install express-async-handler
import InsulinDose from '../models/InsulinDose.js'; // Adjust path if needed
import { auth } from '../middleware/auth.js'; // Adjust path and name as per your auth middleware

const router = express.Router();

// --- Controller Functions (Ideally in a separate controllers/insulinController.js file) ---
// For simplicity, keeping them here for demonstration.

// @desc    Get all insulin doses for a user
// @route   GET /api/insulin
// @access  Private
const getInsulinDoses = asyncHandler(async (req, res) => {
  // Ensure req.user.id is available from the auth middleware
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Not authorized, user ID missing from request.');
  }

  const { page = 1, limit = 10, search = '', type = '' } = req.query;

  const query = { user: req.user.id }; // Filter by the authenticated user

  if (search) {
    // Case-insensitive search across brand and notes
    query.$or = [
      { brand: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }

  if (type) {
    query.insulinType = type; // Filter by insulin type
  }

  const count = await InsulinDose.countDocuments(query);
  const doses = await InsulinDose.find(query)
    .sort({ timestamp: -1 }) // Sort by most recent first
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  res.json({
    doses,
    totalCount: count,
    currentPage: parseInt(page),
    totalPages: Math.ceil(count / parseInt(limit)),
  });
});

// @desc    Add a new insulin dose
// @route   POST /api/insulin
// @access  Private
const addInsulinDose = asyncHandler(async (req, res) => {
  // Ensure req.user.id is available from the auth middleware
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Not authorized, user ID missing from request.');
  }

  const { insulinType, brand, units, timestamp, injectionSite, relatedMeal, notes } = req.body;

  // Basic server-side validation (Mongoose schema also validates)
  if (!insulinType || !units) {
    res.status(400);
    throw new Error('Please provide insulin type and units.');
  }

  try {
    const newDose = await InsulinDose.create({
      user: req.user.id, // Assign the dose to the authenticated user
      insulinType,
      brand,
      units,
      // Use provided timestamp or default to now if not provided/invalid
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      injectionSite,
      relatedMeal, // If relatedMeal is provided, Mongoose will attempt to save it
      notes
    });

    res.status(201).json(newDose);
  } catch (error) {
    // Handle Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({ message: messages.join(', ') });
    } else {
      console.error('Error adding insulin dose:', error);
      res.status(500).json({ message: 'Server Error: Could not save insulin dose.' });
    }
  }
});

// @desc    Update an insulin dose
// @route   PUT /api/insulin/:id
// @access  Private
const updateInsulinDose = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Not authorized, user ID missing from request.');
  }

  const { id } = req.params; // Dose ID from URL parameter
  const { insulinType, brand, units, timestamp, injectionSite, relatedMeal, notes } = req.body;

  const dose = await InsulinDose.findById(id);

  if (!dose) {
    res.status(404);
    throw new Error('Insulin dose not found');
  }

  // Ensure the logged-in user owns this dose
  if (dose.user.toString() !== req.user.id) {
    res.status(403); // Forbidden
    throw new Error('Not authorized to update this dose');
  }

  try {
    const updatedDose = await InsulinDose.findByIdAndUpdate(
      id,
      {
        insulinType,
        brand,
        units,
        timestamp: timestamp ? new Date(timestamp) : dose.timestamp, // Update or keep original
        injectionSite,
        relatedMeal,
        notes
      },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    res.status(200).json(updatedDose);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({ message: messages.join(', ') });
    } else {
      console.error('Error updating insulin dose:', error);
      res.status(500).json({ message: 'Server Error: Could not update insulin dose.' });
    }
  }
});

// @desc    Delete an insulin dose
// @route   DELETE /api/insulin/:id
// @access  Private
const deleteInsulinDose = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Not authorized, user ID missing from request.');
  }

  const { id } = req.params;

  const dose = await InsulinDose.findById(id);

  if (!dose) {
    res.status(404);
    throw new Error('Insulin dose not found');
  }

  // Ensure the logged-in user owns this dose
  if (dose.user.toString() !== req.user.id) {
    res.status(403); // Forbidden
    throw new Error('Not authorized to delete this dose');
  }

  await InsulinDose.deleteOne({ _id: id }); // More robust delete
  res.status(200).json({ message: 'Insulin dose removed' });
});


// --- Routes ---
router.route('/')
  .get(auth, getInsulinDoses)
  .post(auth, addInsulinDose);

router.route('/:id')
  .put(auth, updateInsulinDose)
  .delete(auth, deleteInsulinDose);

export default router;