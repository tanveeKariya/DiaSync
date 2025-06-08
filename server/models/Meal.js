import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  carbs: {
    type: Number,
    required: true
  },
  protein: {
    type: Number
  },
  fat: {
    type: Number
  },
  calories: {
    type: Number
  },
  glycemicIndex: {
    type: Number
  },
  servingSize: {
    type: String
  },
  amount: {
    type: Number,
    default: 1
  }
});

const mealSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  foodItems: [foodItemSchema],
  totalCarbs: {
    type: Number,
    required: true
  },
  totalCalories: {
    type: Number
  },
  notes: {
    type: String
  },
  preGlucose: {
    type: Number
  },
  postGlucose: {
    type: Number
  },
  insulinDose: {
    type: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
mealSchema.index({ user: 1, timestamp: -1 });

const Meal = mongoose.model('Meal', mealSchema);

export default Meal;