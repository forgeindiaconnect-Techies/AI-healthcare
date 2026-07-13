const mongoose = require('mongoose');

const doctorVerificationHistorySchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    action: { 
      type: String, 
      required: true,
      enum: [
        'SUBMITTED',
        'REVIEW_STARTED',
        'DOCUMENT_VERIFIED',
        'DOCUMENT_REJECTED',
        'DOCUMENT_REUPLOAD_REQUESTED',
        'LICENSE_CHECKED',
        'CHANGES_REQUESTED',
        'APPROVED',
        'REJECTED',
        'SUSPENDED',
        'REACTIVATED'
      ]
    },
    previousStatus: { type: String },
    newStatus: { type: String },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorDocument' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByRole: { type: String },
    remarks: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorVerificationHistory', doctorVerificationHistorySchema);
