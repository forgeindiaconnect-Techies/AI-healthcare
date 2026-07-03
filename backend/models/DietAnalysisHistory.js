const mongoose = require('mongoose');

const dietAnalysisHistorySchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  result: {
    type: Object, // Stores the complete AI JSON response
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DietAnalysisHistory', dietAnalysisHistorySchema);
