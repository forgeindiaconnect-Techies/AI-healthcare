const mongoose = require('mongoose');

const doctorDocumentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    documentType: { 
      type: String, 
      required: true,
      enum: [
        'IDENTITY_PROOF',
        'MEDICAL_LICENSE',
        'MEDICAL_DEGREE',
        'SPECIALIZATION_CERTIFICATE',
        'PROFILE_PHOTO',
        'ADDRESS_PROOF',
        'EXPERIENCE_CERTIFICATE',
        'POSTGRADUATE_DEGREE',
        'FELLOWSHIP_CERTIFICATE',
        'HOSPITAL_APPOINTMENT_LETTER',
        'TAX_DOCUMENT',
        'INSURANCE',
        'OTHER'
      ]
    },
    originalFileName: { type: String, required: true },
    storageKey: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String },
    fileSize: { type: Number },
    verificationStatus: { 
      type: String, 
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'REUPLOAD_REQUIRED'],
      default: 'PENDING'
    },
    adminRemarks: { type: String },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectedAt: { type: Date },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorDocument', doctorDocumentSchema);
