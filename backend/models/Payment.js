const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  method: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'insurance'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'successful', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentDetails: {
    // For card: { last4: '4242', brand: 'visa' }
    // For upi: { upiId: 'user@upi' }
    // For netbanking: { bank: 'HDFC', accountName: 'John' }
    type: mongoose.Schema.Types.Mixed
  },
  relatedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

paymentSchema.index({ patient: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
