const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  insuranceProvider: {
    type: String,
    required: true
  },
  policyNumber: {
    type: String,
    required: true
  },
  claimAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending'
  },
  documents: [{
    type: String, // URLs to uploaded documents
    required: true
  }],
  relatedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  description: {
    type: String
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

insuranceClaimSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
