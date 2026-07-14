const mongoose = require('mongoose');

  const appointmentSchema = new mongoose.Schema(
    {
      patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      patientProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
      doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      appointmentDate: { type: Date, required: true },
      appointmentTime: { type: String, required: true }, // "10:30"
      endTime: { type: String },
      duration: { type: Number, default: 30 }, // minutes
      type: {
        type: String,
        enum: ['general', 'follow-up', 'specialist', 'emergency', 'online', 'checkup'],
        default: 'general',
      },
      mode: {
        type: String,
        enum: ['in-person', 'video', 'phone'],
        default: 'in-person',
      },
      priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
      },
      status: {
        type: String,
        enum: ['Pending Doctor Approval', 'Approved - Payment Pending', 'Payment Completed', 'Meeting Scheduled', 'Completed', 'Cancelled', 'Rejected', 'no-show', 'rescheduled', 'pending', 'confirmed'],
        default: 'Pending Doctor Approval',
      },
      reason: { type: String, required: true },
      symptoms: [String],
      preConsultationIntake: {
        healthProblem: String,
        symptoms: [String],
        duration: String,
        painLevel: Number,
        age: Number,
        gender: String,
        allergies: [String],
        currentMedicines: [String],
      },
      notes: {
        patient: String,
        doctor: String,
        admin: String,
      },
      diagnosis: String,
      followUpDate: Date,
      followUpRequired: { type: Boolean, default: false },
      prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
      consultationFee: { type: Number, default: 0 },
      consultationFeePaise: { type: Number, default: 0 },
      commissionRate: { type: Number, default: 20 },
      platformCommissionPaise: { type: Number, default: 0 },
      doctorEarningsPaise: { type: Number, default: 0 },
      paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'waived'], default: 'pending' },
      paymentMethod: String,
      cancellationReason: String,
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      cancelledAt: Date,
      confirmedAt: Date,
      completedAt: Date,
      reminderSent: { type: Boolean, default: false },
      patientJoined: { type: Boolean, default: false },
      doctorJoined: { type: Boolean, default: false },
      meetingLink: String, // for video consultations
      queueNumber: Number,
      roomNumber: String,
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
      deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      deletionReason: { type: String, default: null },
    },
    { timestamps: true }
  );

// Indexes for efficient queries
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1, doctor: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
