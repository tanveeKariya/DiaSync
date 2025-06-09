// // backend/routes/journalRoutes.js
// import express from 'express';
// import { body, validationResult } from 'express-validator';
// import { auth } from '../middleware/auth.js'; // Ensure auth middleware is correctly implemented
// import Journal from '../models/Journal.js'; // Ensure your Mongoose model is correct

// const router = express.Router();

// // Add a new journal entry
// router.post('/', [
//   auth,
//   body('mood').isIn(['Excellent', 'Good', 'Neutral', 'Bad', 'Terrible']).withMessage('Invalid mood'),
//   body('content').not().isEmpty().withMessage('Content is required')
// ], async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const {
//       date,
//       mood,
//       stressLevel,
//       sleepHours,
//       exerciseMinutes,
//       exerciseType,
//       content,
//       tags
//     } = req.body;

//     const journalEntry = new Journal({
//       user: req.user.id, // Assuming req.user.id is set by your auth middleware
//       date: date || new Date(),
//       mood,
//       stressLevel,
//       sleepHours,
//       exerciseMinutes,
//       exerciseType,
//       content,
//       tags
//     });

//     await journalEntry.save();

//     res.status(201).json({
//       message: 'Journal entry added successfully',
//       journalEntry
//     });
//   } catch (error) {
//     console.error('Add journal entry error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get all journal entries for the current user with pagination, search, and filter
// router.get('/', auth, async (req, res) => {
//   try {
//     const { limit: limitStr = '10', page: pageStr = '1', search = '', mood = '' } = req.query;

//     const limit = parseInt(limitStr, 10);
//     const page = parseInt(pageStr, 10);
//     const skip = (page - 1) * limit;

//     const query = { user: req.user.id };

//     // Add search term to content or tags if present
//     if (search) {
//       query.$or = [
//         { content: { $regex: search, $options: 'i' } },
//         { tags: { $regex: search, $options: 'i' } }
//       ];
//     }

//     // Add mood filter if present
//     if (mood && mood !== 'All Moods') { // Handle 'All Moods' if it's sent from frontend
//       query.mood = mood;
//     }

//     // Get total count of documents matching the query (for pagination)
//     const totalCount = await Journal.countDocuments(query);

//     // Fetch entries with pagination and sorting
//     const journalEntries = await Journal.find(query)
//       .sort({ date: -1 }) // Sort by date descending (latest first)
//       .limit(limit)
//       .skip(skip);

//     // CRITICAL: Return an object with 'entries' and 'totalCount'
//     res.json({
//       entries: journalEntries,
//       totalCount: totalCount
//     });

//   } catch (error) {
//     console.error('Get journal entries error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get a specific journal entry
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const journalEntry = await Journal.findOne({
//       _id: req.params.id,
//       user: req.user.id
//     });

//     if (!journalEntry) {
//       return res.status(404).json({ message: 'Journal entry not found' });
//     }

//     res.json(journalEntry);
//   } catch (error) {
//     console.error('Get journal entry error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update a journal entry
// router.put('/:id', auth, async (req, res) => {
//   try {
//     const {
//       date,
//       mood,
//       stressLevel,
//       sleepHours,
//       exerciseMinutes,
//       exerciseType,
//       content,
//       tags
//     } = req.body;

//     // Build journal entry object
//     const journalFields = {};
//     if (date) journalFields.date = date;
//     if (mood) journalFields.mood = mood;
//     if (stressLevel !== undefined) journalFields.stressLevel = stressLevel;
//     if (sleepHours !== undefined) journalFields.sleepHours = sleepHours;
//     if (exerciseMinutes !== undefined) journalFields.exerciseMinutes = exerciseMinutes;
//     if (exerciseType !== undefined) journalFields.exerciseType = exerciseType;
//     if (content) journalFields.content = content;
//     if (tags) journalFields.tags = tags;

//     let journalEntry = await Journal.findOne({
//       _id: req.params.id,
//       user: req.user.id
//     });

//     if (!journalEntry) {
//       return res.status(404).json({ message: 'Journal entry not found' });
//     }

//     journalEntry = await Journal.findByIdAndUpdate(
//       req.params.id,
//       { $set: journalFields },
//       { new: true } // Return the updated document
//     );

//     res.json({
//       message: 'Journal entry updated successfully',
//       journalEntry
//     });
//   } catch (error) {
//     console.error('Update journal entry error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Delete a journal entry
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const journalEntry = await Journal.findOne({
//       _id: req.params.id,
//       user: req.user.id
//     });

//     if (!journalEntry) {
//       return res.status(404).json({ message: 'Journal entry not found' });
//     }

//     await Journal.findByIdAndDelete(req.params.id);

//     res.json({ message: 'Journal entry removed' });
//   } catch (error) {
//     console.error('Delete journal entry error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get mood and wellness trends (assuming this data structure is okay)
// router.get('/stats/trends', auth, async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     const query = { user: req.user.id };

//     // Add date range if provided
//     if (startDate || endDate) {
//       query.date = {};
//       if (startDate) query.date.$gte = new Date(startDate);
//       if (endDate) query.date.$lte = new Date(endDate);
//     }

//     const journalEntries = await Journal.find(query).sort({ date: 1 });

//     if (!journalEntries.length) {
//       return res.json({
//         moodTrend: [],
//         stressAvg: 0,
//         sleepAvg: 0,
//         exerciseAvg: 0
//       });
//     }

//     // Calculate statistics
//     const moodMap = {
//       'Excellent': 5,
//       'Good': 4,
//       'Neutral': 3,
//       'Bad': 2,
//       'Terrible': 1
//     };

//     const moodTrend = journalEntries.map(entry => ({
//       date: entry.date,
//       mood: entry.mood,
//       moodValue: moodMap[entry.mood] // Removed TypeScript type assertion
//     }));

//     const stressValues = journalEntries.filter(e => e.stressLevel).map(e => e.stressLevel);
//     const sleepValues = journalEntries.filter(e => e.sleepHours).map(e => e.sleepHours);
//     const exerciseValues = journalEntries.filter(e => e.exerciseMinutes).map(e => e.exerciseMinutes);

//     const stressAvg = stressValues.length
//       ? stressValues.reduce((a, b) => a + b, 0) / stressValues.length
//       : 0;

//     const sleepAvg = sleepValues.length
//       ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
//       : 0;

//     const exerciseAvg = exerciseValues.length
//       ? exerciseValues.reduce((a, b) => a + b, 0) / exerciseValues.length
//       : 0;

//     res.json({
//       moodTrend,
//       stressAvg,
//       sleepAvg,
//       exerciseAvg
//     });
//   } catch (error) {
//     console.error('Get journal trends error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// export default router;