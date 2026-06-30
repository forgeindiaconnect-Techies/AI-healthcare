const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  text: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileType: {
    type: String, // 'image', 'document', 'prescription'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

// Index for efficient querying of chat history between two users or for an appointment
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ appointment: 1 });

module.exports = mongoose.model('Message', messageSchema);
