const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    currentMedications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
      },
    ],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      expiryDate: Date,
    },
    vitals: [
      {
        date: { type: Date, default: Date.now },
        bloodPressure: { systolic: Number, diastolic: Number },
        heartRate: Number,
        temperature: Number,
        oxygenSaturation: Number,
        glucoseLevel: Number,
        weight: Number,
        notes: String,
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    healthScore: { type: Number, min: 0, max: 100, default: 75 },
    smokingStatus: { type: String, enum: ['never', 'former', 'current', ''] },
    alcoholConsumption: { type: String, enum: ['none', 'occasional', 'moderate', 'heavy', ''] },
    exerciseFrequency: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active', ''] },
    preferredDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    medicalHistory: [
      {
        condition: String,
        diagnosedDate: Date,
        resolvedDate: Date,
        notes: String,
      },
    ],
    surgicalHistory: [
      {
        procedure: String,
        date: Date,
        hospital: String,
        surgeon: String,
        notes: String,
      },
    ],
    familyHistory: [
      {
        condition: String,
        relationship: String,
      },
    ],
    vaccinationRecord: [
      {
        vaccine: String,
        date: Date,
        nextDueDate: Date,
        provider: String,
      },
    ],
    aiDiagnosisChatHistory: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    lifestyle: {
      diet: String,
      exercise: String,
      sleep: String,
      water: String,
      smokingAlcohol: String,
      notes: String,
    },
    totalAppointments: { type: Number, default: 0 },
    totalReports: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletionReason: { type: String, default: null },
  },
  { timestamps: true }
);

// Virtual: BMI
patientSchema.virtual('bmi').get(function () {
  if (this.height && this.weight) {
    return (this.weight / Math.pow(this.height / 100, 2)).toFixed(1);
  }
  return null;
});

// Virtual: age
patientSchema.virtual('age').get(function () {
  if (this.user && this.user.dateOfBirth) {
    const diff = Date.now() - new Date(this.user.dateOfBirth).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }
  return null;
});

module.exports = mongoose.model('Patient', patientSchema);
