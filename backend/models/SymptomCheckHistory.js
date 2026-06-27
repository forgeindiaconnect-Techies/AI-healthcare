const mongoose = require('mongoose');

const symptomCheckHistorySchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptomName: {
    type: String,
    required: true
  },
  ageGroup: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true
  },
  results: {
    recommended: [{ type: String }],
    avoid: [{ type: String }],
    hydration: [{ type: String }],
    mealPlan: {
      Morning: [{ type: String }],
      Afternoon: [{ type: String }],
      Evening: [{ type: String }],
      Night: [{ type: String }]
    },
    warning: { type: String },
    homeCare: [{ type: String }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SymptomCheckHistory', symptomCheckHistorySchema);
