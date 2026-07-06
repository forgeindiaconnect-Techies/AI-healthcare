const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true },
    subSpecialties: [String],
    licenseNumber: { type: String, required: true, unique: true },
    registeredNumber: { type: String },
    licenseExpiry: Date,
    experience: { type: Number, default: 0 }, // years
    qualification: { type: String }, // e.g., MBBS, MD
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Suspended', 'Request More Documents'], default: 'Pending' },
    rejectionReason: { type: String },
    documents: [{
        title: String, // e.g., 'Medical License', 'Degree Certificate', 'Government ID'
        fileUrl: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
      },
    ],
    certifications: [
      {
        name: String,
        issuingBody: String,
        issueDate: Date,
        expiryDate: Date,
      },
    ],
    hospital: {
      name: String,
      address: String,
      department: String,
    },
    facilityType: { type: String, enum: ['Clinic', 'Hospital', 'Virtual', 'Other'], default: 'Clinic' },
    clinicAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    consultationFee: { type: Number, default: 0 },
    consultationDuration: { type: Number, default: 30 }, // minutes
    availability: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sunday
        startTime: String, // "09:00"
        endTime: String,   // "17:00"
        isAvailable: { type: Boolean, default: true },
        maxAppointments: { type: Number, default: 10 },
      },
    ],
    offDays: [{ type: Date }],
    bio: { type: String, maxlength: 1000 },
    languages: [String],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    totalRatings: { type: Number, default: 0 },
    reviews: [
      {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        date: { type: Date, default: Date.now },
      },
    ],
    isVerified: { type: Boolean, default: false },
    isAcceptingPatients: { type: Boolean, default: true },
    totalPatients: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Method: add review and update rating
doctorSchema.methods.addReview = async function (patientId, rating, comment) {
  const existingReview = this.reviews.find((r) => r.patient.toString() === patientId.toString());
  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
  } else {
    this.reviews.push({ patient: patientId, rating, comment });
  }
  const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.rating = (total / this.reviews.length).toFixed(1);
  this.totalRatings = this.reviews.length;
  await this.save();
};

module.exports = mongoose.model('Doctor', doctorSchema);
