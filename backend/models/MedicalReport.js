const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    title: { type: String, required: true },
    reportType: {
      type: String,
      enum: ['lab', 'xray', 'mri', 'ct-scan', 'ultrasound', 'ecg', 'prescription', 'discharge', 'other'],
      required: true,
    },
    description: String,
    fileUrl: { type: String, required: true },
    filePublicId: { type: String },
    fileName: String,
    fileSize: Number, // bytes
    mimeType: String,
    reportDate: { type: Date, default: Date.now },
    labName: String,
    doctorName: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'critical', 'normal'],
      default: 'pending',
    },
    isSharedWithDoctor: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    extractedText: { type: String },
    aiAnalysis: {
      summary: String,
      keyFindings: [String],
      recommendations: [String],
      riskLevel: { type: String, enum: ['low', 'moderate', 'high', 'critical'] },
      analyzedAt: Date,
      model: String,
    },
    tags: [String],
    isArchived: { type: Boolean, default: false },
    doctorNotes: { type: String },
    finalReport: { type: String },
    reviewedDate: { type: Date },
    aiChatHistory: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletionReason: { type: String, default: null },
  },
  { timestamps: true }
);

medicalReportSchema.index({ patient: 1, reportDate: -1 });
medicalReportSchema.index({ patient: 1, reportType: 1 });
medicalReportSchema.index({ status: 1 });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
