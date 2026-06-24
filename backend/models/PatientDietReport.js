const mongoose = require('mongoose');

const patientDietReportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  disease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disease',
    required: true
  },
  dietPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietPlan'
  },
  patientName: {
    type: String,
    required: true
  },
  ageGroup: {
    type: String,
  },
  diseaseName: {
    type: String,
    required: true
  },
  diseaseType: {
    type: String,
  },
  severity: {
    type: String,
  },
  reportData: {
    morning: [{ type: String }],
    afternoon: [{ type: String }],
    evening: [{ type: String }],
    night: [{ type: String }],
    monthlyPlan: [{ type: String }],
    avoidFoods: [{ type: String }],
    warnings: [{ type: String }],
  },
  pdfUrl: {
    type: String // In case we save the generated PDF to cloudinary or s3
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PatientDietReport', patientDietReportSchema);
