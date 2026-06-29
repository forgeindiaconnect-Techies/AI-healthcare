const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    primaryDiagnosis: { type: String, required: true },
    confidence: { type: Number, required: true }, // e.g., 92
    possibleConditions: [{ type: String }],
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    symptoms: [{ type: String }],
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      oxygenSaturation: Number,
      bodyTemperature: Number,
      respiratoryRate: Number,
      bloodSugar: Number,
      cholesterol: Number,
    },
    treatmentAdvice: { type: String },
    labRecommendations: [{ type: String }],
    followUpDate: { type: Date },
    aiGenerated: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
