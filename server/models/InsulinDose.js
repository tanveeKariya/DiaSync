// import mongoose from 'mongoose';

// const insulinDoseSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   insulinType: {
//     type: String,
//     enum: ['Basal', 'Bolus', 'Correction', 'Mixed'],
//     required: true
//   },
//   brand: {
//     type: String
//   },
//   units: {
//     type: Number,
//     required: true
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now,
//     required: true
//   },
//   injectionSite: {
//     type: String,
//     enum: ['Abdomen', 'Thigh', 'Arm', 'Buttock', 'Other', 'Not Specified'],
//     default: 'Not Specified'
//   },
//   relatedMeal: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Meal'
//   },
//   notes: {
//     type: String
//   }
// }, {
//   timestamps: true
// });

// // Index for efficient queries
// insulinDoseSchema.index({ user: 1, timestamp: -1 });

// const InsulinDose = mongoose.model('InsulinDose', insulinDoseSchema);

// export default InsulinDose;
// server/models/InsulinDose.js

import mongoose from 'mongoose';

const insulinDoseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Crucial: Ensures every dose is linked to a user
  },
  insulinType: {
    type: String,
    enum: ['Basal', 'Bolus', 'Correction', 'Mixed'], // Ensure these match frontend constants
    required: true
  },
  brand: {
    type: String,
    trim: true // Removes whitespace
  },
  units: {
    type: Number,
    required: true,
    min: [0.1, 'Units must be a positive number'], // Add a minimum value validation
    validate: {
      validator: Number.isFinite,
      message: 'Units must be a valid number'
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  injectionSite: {
    type: String,
    enum: ['Abdomen', 'Thigh', 'Arm', 'Buttock', 'Other', 'Not Specified'], // Ensure these match frontend constants
    default: 'Not Specified'
  },
  relatedMeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    // This field is optional if not provided
    // If you want to strictly validate if a meal exists when provided,
    // you'd need custom validation or a pre-save hook.
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps automatically
});

// Index for efficient queries, especially by user and then by most recent timestamp
insulinDoseSchema.index({ user: 1, timestamp: -1 });

const InsulinDose = mongoose.model('InsulinDose', insulinDoseSchema);

export default InsulinDose;