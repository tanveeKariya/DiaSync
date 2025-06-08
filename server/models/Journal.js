import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  mood: {
    type: String,
    enum: ['Excellent', 'Good', 'Neutral', 'Bad', 'Terrible'],
    required: true
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  sleepHours: {
    type: Number
  },
  exerciseMinutes: {
    type: Number
  },
  exerciseType: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
journalEntrySchema.index({ user: 1, date: -1 });

const Journal = mongoose.model('Journal', journalEntrySchema);

export default Journal;