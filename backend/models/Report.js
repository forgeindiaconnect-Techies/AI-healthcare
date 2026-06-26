const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Blood Test', 'X-Ray', 'CT Scan', 'MRI Scan', 'Previous Prescription', 'General Medical Report', 'Other'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending Review', 'Reviewed'],
    default: 'Pending Review'
  },
  doctorNotes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
