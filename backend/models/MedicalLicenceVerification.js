const mongoose = require('mongoose');

const medicalLicenceVerificationSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    licenceNumber: { type: String, required: true },
    medicalCouncil: { type: String },
    verificationMethod: { type: String, enum: ['API', 'MANUAL', 'OFFICIAL_REGISTRY'], required: true },
    verificationStatus: { 
      type: String, 
      enum: ['NOT_CHECKED', 'CHECK_IN_PROGRESS', 'VERIFIED', 'NOT_FOUND', 'DETAILS_MISMATCH', 'EXPIRED', 'SUSPENDED', 'MANUAL_REVIEW_REQUIRED'],
      required: true
    },
    registeredName: { type: String },
    registrationStatus: { type: String },
    specialization: { type: String },
    expiryDate: { type: Date },
    sourceReference: { type: String },
    rawResponseReference: { type: String }, // Used to store reference to raw API response without bloating the DB
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedAt: { type: Date, default: Date.now },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalLicenceVerification', medicalLicenceVerificationSchema);
