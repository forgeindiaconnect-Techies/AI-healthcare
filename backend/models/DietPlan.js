const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  disease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disease',
    required: true
  },
  diseaseType: {
    type: String, // e.g. "Type 1", "Type 2", "Gestational Diabetes"
    required: true
  },
  severity: {
    type: String, // e.g. "Mild", "Moderate", "High"
    required: true
  },
  dailyPlan: {
    morning: [{ type: String }],
    afternoon: [{ type: String }],
    evening: [{ type: String }],
    night: [{ type: String }]
  },
  weeklyPlan: [{ type: String }],
  monthlyPlan: [{ type: String }],
  avoidFoods: [{ type: String }],
  warnings: [{ type: String }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);
