const mongoose = require('mongoose');

const doctorHospitalDetailsSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    hospitalName: { type: String, required: true },
    clinicName: { type: String },
    department: { type: String },
    roomNumber: { type: String },
    floor: { type: String },
    block: { type: String },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    landmark: { type: String },
    contactNumber: { type: String, required: true },
    visitingStartTime: { type: String }, // e.g. "09:00"
    visitingEndTime: { type: String },   // e.g. "17:00"
    offlineConsultationFee: { type: Number, default: 0 },
    instructions: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorHospitalDetails', doctorHospitalDetailsSchema);
