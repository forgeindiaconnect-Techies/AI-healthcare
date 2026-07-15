const mongoose = require('mongoose');

const appointmentSlotSchema = new mongoose.Schema(
  {
    doctor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    availabilityId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'DoctorAvailability',
      required: true
    },
    appointmentDate: { 
      type: Date, 
      required: true 
    },
    startDateTime: { 
      type: Date, 
      required: true 
    },
    endDateTime: { 
      type: Date, 
      required: true 
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'BOOKED', 'BLOCKED'],
      default: 'AVAILABLE'
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    }
  },
  { timestamps: true }
);

// Prevent double booking at database level with a unique compound index
appointmentSlotSchema.index({ doctor: 1, startDateTime: 1 }, { unique: true });

module.exports = mongoose.model('AppointmentSlot', appointmentSlotSchema);
