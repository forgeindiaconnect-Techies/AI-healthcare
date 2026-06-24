const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a disease name'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  tags: [{
    type: String,
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Disease', diseaseSchema);
