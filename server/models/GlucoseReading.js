import mongoose from 'mongoose';

const glucoseReadingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['mg/dL', 'mmol/L'],
    default: 'mg/dL',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  readingType: {
    type: String,
    enum: ['Manual', 'CGM', 'Lab'],
    default: 'Manual'
  },
  mealContext: {
    type: String,
    enum: ['Before Meal', 'After Meal', 'Fasting', 'Bedtime', 'Not Specified'],
    default: 'Not Specified'
  },
  notes: {
    type: String
  },
  tags: [{
    type: String
  }],
  feeling: {
    type: String,
    enum: ['Very Low', 'Low', 'Normal', 'High', 'Very High', 'Not Specified'],
    default: 'Not Specified'
  }
}, {
  timestamps: true
});

// Index for efficient queries
glucoseReadingSchema.index({ user: 1, timestamp: -1 });

const GlucoseReading = mongoose.model('GlucoseReading', glucoseReadingSchema);

export default GlucoseReading;