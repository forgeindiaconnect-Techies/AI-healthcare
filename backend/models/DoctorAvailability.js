const mongoose = require('mongoose');

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    // Optional: if it's for a specific date (override), or if it's just a recurring rule
    date: { 
      type: Date 
    },
    // 0 = Sunday, 1 = Monday, etc. (for recurring availability)
    dayOfWeek: { 
      type: Number, 
      min: 0, 
      max: 6 
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrenceEndDate: {
      type: Date
    },
    startTime: { 
      type: String, // format "HH:mm" e.g., "09:00"
      required: true 
    },
    endTime: { 
      type: String, // format "HH:mm" e.g., "17:00"
      required: true 
    },
    slotDuration: { 
      type: Number, // in minutes (10, 15, 20, 30, 45, 60)
      required: true,
      default: 30
    },
    breaks: [
      {
        startTime: String, // "13:00"
        endTime: String    // "14:00"
      }
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'LEAVE'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
