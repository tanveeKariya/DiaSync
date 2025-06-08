import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import Meal from '../models/Meal.js';

const router = express.Router();

// Add a new meal
router.post('/', [
  auth,
  body('mealType').isIn(['Breakfast', 'Lunch', 'Dinner', 'Snack']).withMessage('Invalid meal type'),
  body('totalCarbs').isNumeric().withMessage('Total carbs must be a number'),
  body('foodItems').isArray().withMessage('Food items must be an array'),
  body('foodItems.*.name').not().isEmpty().withMessage('Food item name is required'),
  body('foodItems.*.carbs').isNumeric().withMessage('Food item carbs must be a number')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      mealType, 
      timestamp, 
      foodItems, 
      totalCarbs, 
      totalCalories, 
      notes, 
      preGlucose, 
      postGlucose, 
      insulinDose 
    } = req.body;

    const meal = new Meal({
      user: req.user.id,
      mealType,
      timestamp: timestamp || new Date(),
      foodItems,
      totalCarbs,
      totalCalories,
      notes,
      preGlucose,
      postGlucose,
      insulinDose
    });

    await meal.save();

    res.status(201).json({ 
      message: 'Meal added successfully', 
      meal 
    });
  } catch (error) {
    console.error('Add meal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all meals for the current user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 20, skip = 0 } = req.query;
    
    const query = { user: req.user.id };
    
    // Add date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const meals = await Meal.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(skip));
    
    res.json(meals);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific meal
router.get('/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    res.json(meal);
  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a meal
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      mealType, 
      timestamp, 
      foodItems, 
      totalCarbs, 
      totalCalories, 
      notes, 
      preGlucose, 
      postGlucose, 
      insulinDose 
    } = req.body;
    
    // Build meal object
    const mealFields = {};
    if (mealType) mealFields.mealType = mealType;
    if (timestamp) mealFields.timestamp = timestamp;
    if (foodItems) mealFields.foodItems = foodItems;
    if (totalCarbs !== undefined) mealFields.totalCarbs = totalCarbs;
    if (totalCalories !== undefined) mealFields.totalCalories = totalCalories;
    if (notes !== undefined) mealFields.notes = notes;
    if (preGlucose !== undefined) mealFields.preGlucose = preGlucose;
    if (postGlucose !== undefined) mealFields.postGlucose = postGlucose;
    if (insulinDose !== undefined) mealFields.insulinDose = insulinDose;
    
    let meal = await Meal.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    meal = await Meal.findByIdAndUpdate(
      req.params.id,
      { $set: mealFields },
      { new: true }
    );
    
    res.json({ 
      message: 'Meal updated successfully', 
      meal 
    });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a meal
router.delete('/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    await Meal.findByIdAndRemove(req.params.id);
    
    res.json({ message: 'Meal removed' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get meal suggestions based on glucose patterns
router.get('/suggestions/smart', auth, async (req, res) => {
  try {
    // This would typically involve complex analysis of glucose patterns and meal impacts
    // For MVP, we'll return dummy suggestions
    const suggestions = [
      {
        name: 'Balanced Breakfast',
        mealType: 'Breakfast',
        totalCarbs: 45,
        foodItems: [
          { name: 'Greek Yogurt', carbs: 7, protein: 15, fat: 3 },
          { name: 'Berries', carbs: 15, protein: 1, fat: 0 },
          { name: 'Granola', carbs: 23, protein: 5, fat: 8 }
        ],
        benefits: 'Steady glucose response with protein and fiber'
      },
      {
        name: 'Low-Carb Lunch',
        mealType: 'Lunch',
        totalCarbs: 20,
        foodItems: [
          { name: 'Grilled Chicken Salad', carbs: 8, protein: 35, fat: 12 },
          { name: 'Olive Oil Dressing', carbs: 0, protein: 0, fat: 14 },
          { name: 'Avocado', carbs: 12, protein: 3, fat: 22 }
        ],
        benefits: 'Minimal glucose impact with healthy fats'
      },
      {
        name: 'Balanced Dinner',
        mealType: 'Dinner',
        totalCarbs: 50,
        foodItems: [
          { name: 'Salmon', carbs: 0, protein: 25, fat: 15 },
          { name: 'Quinoa', carbs: 30, protein: 8, fat: 4 },
          { name: 'Roasted Vegetables', carbs: 20, protein: 4, fat: 6 }
        ],
        benefits: 'Complex carbs with protein for steady evening levels'
      }
    ];
    
    res.json(suggestions);
  } catch (error) {
    console.error('Get meal suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;