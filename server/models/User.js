// server/models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // --- Personal Info ---
  diabetesType: {
    type: String,
    enum: ['Type 1', 'Type 2', 'Gestational', 'Other'],
    default: 'Type 1'
  },
  dateOfDiagnosis: {
    type: Date
  },
  // --- Medical Details ---
  insulinType: {
    basal: { type: String, trim: true },
    bolus: { type: String, trim: true }
  },
  targetGlucoseRange: {
    min: {
      type: Number,
      default: 70
    },
    max: {
      type: Number,
      default: 180
    }
  },
  // --- Emergency Contacts ---
  emergencyContacts: [{ // Array of subdocuments
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  }],
  // --- Doctor Info ---
  doctor: { // Embedded document
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    accessCode: { type: String, trim: true }
  },
  // --- Preferences / Settings ---
  settings: { // Embedded document
    glucoseUnit: {
      type: String,
      enum: ['mg/dL', 'mmol/L'],
      default: 'mg/dL'
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;