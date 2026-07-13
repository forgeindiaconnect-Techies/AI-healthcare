const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorNotes: { type: String, default: '' },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    diagnosis: { type: String, default: '' },
    duration: { type: Number, default: 0 }, // in seconds or minutes
    summary: { type: String, default: '' },
    simpleExplanation: { type: String, default: '' },
    treatmentAdvice: { type: String, default: '' },
    testsNeeded: { type: String, default: '' },
    followUpDate: { type: Date },
    emergencySigns: { type: String, default: '' },
    callHistory: [{
      joinedAt: Date,
      leftAt: Date
    }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletionReason: { type: String, default: null },
  },
  { timestamps: true }
);


consultationSchema.index({ patient: 1 });
consultationSchema.index({ doctor: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);
