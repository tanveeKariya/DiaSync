import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import GlucoseReading from '../models/GlucoseReading.js';

const router = express.Router();

// Add a new glucose reading
router.post('/', [
  auth,
  body('value').isNumeric().withMessage('Glucose value must be a number'),
  body('unit').isIn(['mg/dL', 'mmol/L']).withMessage('Invalid unit'),
  body('readingType').isIn(['Manual', 'CGM', 'Lab']).withMessage('Invalid reading type'),
  body('mealContext').isIn(['Before Meal', 'After Meal', 'Fasting', 'Bedtime', 'Not Specified']).withMessage('Invalid meal context')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { value, unit, timestamp, readingType, mealContext, notes, tags, feeling } = req.body;

    const glucoseReading = new GlucoseReading({
      user: req.user.id,
      value,
      unit,
      timestamp: timestamp || new Date(),
      readingType,
      mealContext,
      notes,
      tags,
      feeling
    });

    await glucoseReading.save();

    res.status(201).json({ 
      message: 'Glucose reading added successfully', 
      glucoseReading 
    });
  } catch (error) {
    console.error('Add glucose reading error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all glucose readings for the current user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 100, skip = 0 } = req.query;
    
    const query = { user: req.user.id };
    
    // Add date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const glucoseReadings = await GlucoseReading.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(skip));
    
    res.json(glucoseReadings);
  } catch (error) {
    console.error('Get glucose readings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific glucose reading
router.get('/:id', auth, async (req, res) => {
  try {
    const glucoseReading = await GlucoseReading.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!glucoseReading) {
      return res.status(404).json({ message: 'Glucose reading not found' });
    }
    
    res.json(glucoseReading);
  } catch (error) {
    console.error('Get glucose reading error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a glucose reading
router.put('/:id', auth, async (req, res) => {
  try {
    const { value, unit, timestamp, readingType, mealContext, notes, tags, feeling } = req.body;
    
    // Build glucose reading object
    const glucoseFields = {};
    if (value !== undefined) glucoseFields.value = value;
    if (unit) glucoseFields.unit = unit;
    if (timestamp) glucoseFields.timestamp = timestamp;
    if (readingType) glucoseFields.readingType = readingType;
    if (mealContext) glucoseFields.mealContext = mealContext;
    if (notes !== undefined) glucoseFields.notes = notes;
    if (tags) glucoseFields.tags = tags;
    if (feeling) glucoseFields.feeling = feeling;
    
    let glucoseReading = await GlucoseReading.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!glucoseReading) {
      return res.status(404).json({ message: 'Glucose reading not found' });
    }
    
    glucoseReading = await GlucoseReading.findByIdAndUpdate(
      req.params.id,
      { $set: glucoseFields },
      { new: true }
    );
    
    res.json({ 
      message: 'Glucose reading updated successfully', 
      glucoseReading 
    });
  } catch (error) {
    console.error('Update glucose reading error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a glucose reading
// 
router.delete('/:id', auth, async (req, res) => {
  try {
    // Attempt to find and delete the reading, ensuring it belongs to the authenticated user
    const deletedReading = await GlucoseReading.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!deletedReading) {
      // If no document was found and deleted, it means:
      // 1. The ID didn't exist in the database.
      // 2. The ID existed, but it didn't belong to the authenticated user.
      // In both cases, a 404 Not Found is appropriate.
      return res.status(404).json({ message: 'Glucose reading not found or not authorized to delete.' });
    }
    
    // If deletion was successful
    res.json({ message: 'Glucose reading removed successfully.' });
  } catch (error) {
    // Crucial: Catch specific Mongoose CastError for invalid ObjectIDs
    if (error.name === 'CastError') {
      console.error('Invalid ID format for deletion:', req.params.id, error.message);
      return res.status(400).json({ message: 'Invalid reading ID format provided.' });
    }
    
    // For any other unexpected errors, log them and send a generic 500
    console.error('Delete glucose reading error:', error);
    res.status(500).json({ message: 'Server error: Could not delete reading.' });
  }
});
// Get statistics for glucose readings
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { user: req.user.id };
    
    // Add date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const readings = await GlucoseReading.find(query);
    
    if (!readings.length) {
      return res.json({
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        inRange: 0,
        belowRange: 0,
        aboveRange: 0
      });
    }
    
    const user = req.user;
    const { min: targetMin, max: targetMax } = user.targetGlucoseRange;
    
    // Calculate statistics
    const values = readings.map(r => r.value);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate in-range percentages
    const inRange = readings.filter(r => r.value >= targetMin && r.value <= targetMax).length;
    const belowRange = readings.filter(r => r.value < targetMin).length;
    const aboveRange = readings.filter(r => r.value > targetMax).length;
    
    res.json({
      count,
      average,
      min,
      max,
      inRange,
      belowRange,
      aboveRange,
      inRangePercentage: (inRange / count) * 100,
      belowRangePercentage: (belowRange / count) * 100,
      aboveRangePercentage: (aboveRange / count) * 100
    });
  } catch (error) {
    console.error('Get glucose stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;