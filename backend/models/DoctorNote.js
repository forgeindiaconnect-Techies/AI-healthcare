const mongoose = require('mongoose');

const doctorNoteSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    note: { type: String, required: true }, // Rich text or long string
    healthScore: { type: Number, min: 0, max: 100 },
    lifestyleRecommendations: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorNote', doctorNoteSchema);
