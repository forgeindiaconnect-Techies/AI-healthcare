const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCountDoctor: {
      type: Number,
      default: 0,
    },
    unreadCountPatient: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure uniqueness per doctor-patient pair
conversationSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
