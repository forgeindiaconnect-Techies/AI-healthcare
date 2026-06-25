const mongoose = require('mongoose');

const labRecommendationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    testName: { type: String, required: true },
    reason: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    estimatedCost: { type: String }, // e.g., "$50"
    preparationInstructions: { type: String },
    status: { type: String, enum: ['Pending', 'Completed', 'Cancelled'], default: 'Pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabRecommendation', labRecommendationSchema);
