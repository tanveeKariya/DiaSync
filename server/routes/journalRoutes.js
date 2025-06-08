import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import Journal from '../models/Journal.js';

const router = express.Router();

// Add a new journal entry
router.post('/', [
  auth,
  body('mood').isIn(['Excellent', 'Good', 'Neutral', 'Bad', 'Terrible']).withMessage('Invalid mood'),
  body('content').not().isEmpty().withMessage('Content is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      date, 
      mood, 
      stressLevel, 
      sleepHours, 
      exerciseMinutes, 
      exerciseType, 
      content, 
      tags 
    } = req.body;

    const journalEntry = new Journal({
      user: req.user.id,
      date: date || new Date(),
      mood,
      stressLevel,
      sleepHours,
      exerciseMinutes,
      exerciseType,
      content,
      tags
    });

    await journalEntry.save();

    res.status(201).json({ 
      message: 'Journal entry added successfully', 
      journalEntry 
    });
  } catch (error) {
    console.error('Add journal entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all journal entries for the current user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 20, skip = 0 } = req.query;
    
    const query = { user: req.user.id };
    
    // Add date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const journalEntries = await Journal.find(query)
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip(Number(skip));
    
    res.json(journalEntries);
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific journal entry
router.get('/:id', auth, async (req, res) => {
  try {
    const journalEntry = await Journal.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!journalEntry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    res.json(journalEntry);
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a journal entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      date, 
      mood, 
      stressLevel, 
      sleepHours, 
      exerciseMinutes, 
      exerciseType, 
      content, 
      tags 
    } = req.body;
    
    // Build journal entry object
    const journalFields = {};
    if (date) journalFields.date = date;
    if (mood) journalFields.mood = mood;
    if (stressLevel !== undefined) journalFields.stressLevel = stressLevel;
    if (sleepHours !== undefined) journalFields.sleepHours = sleepHours;
    if (exerciseMinutes !== undefined) journalFields.exerciseMinutes = exerciseMinutes;
    if (exerciseType !== undefined) journalFields.exerciseType = exerciseType;
    if (content) journalFields.content = content;
    if (tags) journalFields.tags = tags;
    
    let journalEntry = await Journal.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!journalEntry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    journalEntry = await Journal.findByIdAndUpdate(
      req.params.id,
      { $set: journalFields },
      { new: true }
    );
    
    res.json({ 
      message: 'Journal entry updated successfully', 
      journalEntry 
    });
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a journal entry
// Delete a journal entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const journalEntry = await Journal.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!journalEntry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    // --- FIX START ---
    // Change from findByIdAndRemove to findByIdAndDelete
    await Journal.findByIdAndDelete(req.params.id); // <--- HERE IS THE CHANGE
    // --- FIX END ---

    res.json({ message: 'Journal entry removed' });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mood and wellness trends
router.get('/stats/trends', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { user: req.user.id };
    
    // Add date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const journalEntries = await Journal.find(query).sort({ date: 1 });
    
    if (!journalEntries.length) {
      return res.json({
        moodTrend: [],
        stressAvg: 0,
        sleepAvg: 0,
        exerciseAvg: 0
      });
    }
    
    // Calculate statistics
    const moodMap = {
      'Excellent': 5,
      'Good': 4,
      'Neutral': 3,
      'Bad': 2,
      'Terrible': 1
    };
    
    const moodTrend = journalEntries.map(entry => ({
      date: entry.date,
      mood: entry.mood,
      moodValue: moodMap[entry.mood]
    }));
    
    const stressValues = journalEntries.filter(e => e.stressLevel).map(e => e.stressLevel);
    const sleepValues = journalEntries.filter(e => e.sleepHours).map(e => e.sleepHours);
    const exerciseValues = journalEntries.filter(e => e.exerciseMinutes).map(e => e.exerciseMinutes);
    
    const stressAvg = stressValues.length 
      ? stressValues.reduce((a, b) => a + b, 0) / stressValues.length 
      : 0;
      
    const sleepAvg = sleepValues.length 
      ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length 
      : 0;
      
    const exerciseAvg = exerciseValues.length 
      ? exerciseValues.reduce((a, b) => a + b, 0) / exerciseValues.length 
      : 0;
    
    res.json({
      moodTrend,
      stressAvg,
      sleepAvg,
      exerciseAvg
    });
  } catch (error) {
    console.error('Get journal trends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;