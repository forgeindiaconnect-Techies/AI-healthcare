const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    type: { type: String, required: true }, // e.g., "Next Visit", "Blood Pressure Review"
    timeline: { type: String, required: true }, // e.g., "7 Days", "30 Days"
    status: { type: String, enum: ['Scheduled', 'Completed', 'Missed'], default: 'Scheduled' },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FollowUp', followUpSchema);
