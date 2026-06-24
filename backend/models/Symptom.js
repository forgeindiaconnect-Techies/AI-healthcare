const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a symptom name'],
    unique: true,
    trim: true,
  },
  recommended: [{
    type: String,
  }],
  avoid: [{
    type: String,
  }],
  hydration: [{
    type: String,
  }],
  mealPlan: {
    Morning: [{ type: String }],
    Afternoon: [{ type: String }],
    Evening: [{ type: String }],
    Night: [{ type: String }],
  },
  warning: {
    type: String,
  },
  homeCare: [{
    type: String,
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Symptom', symptomSchema);
