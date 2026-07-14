const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true },
    subSpecialties: [String],
    
    // Updated License and Qualification Info
    qualification: { type: String }, // e.g., MBBS, MD
    medicalCollege: { type: String },
    graduationYear: { type: Number },
    experience: { type: Number, default: 0 }, // years
    
    medicalLicenseNumber: { type: String, required: true, unique: true },
    registeredNumber: { type: String },
    medicalCouncil: { type: String },
    licenseState: { type: String },
    licenseCountry: { type: String, default: 'India' },
    licenseIssueDate: { type: Date },
    licenseExpiryDate: { type: Date },

    // Status mapping to new workflow
    status: { 
      type: String, 
      enum: ['DRAFT', 'PENDING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'SUSPENDED'], 
      default: 'DRAFT' 
    },
    
    // Approval Workflow Status
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    
    // Verification Metadata
    verificationStatus: { type: String, default: 'DRAFT' },
    licenseVerificationStatus: {
      type: String,
      enum: [
        "pending",
        "under_review",
        "verified",
        "not_found",
        "mismatch",
        "inactive",
        "suspended",
        "cancelled"
      ],
      default: "pending"
    },
    isLicenseVerified: {
      type: Boolean,
      default: false
    },
    licenseVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    licenseVerifiedAt: {
      type: Date,
      default: null
    },
    licenseVerificationRemarks: {
      type: String,
      default: ""
    },
    licenseVerificationSource: {
      type: String,
      default: ""
    },
    licenseVerificationSourceUrl: {
      type: String,
      default: ""
    },
    nmcVerificationDetails: {
      registeredNameFound: String,
      registrationNumberFound: String,
      registrationYear: String,
      medicalCouncil: String,
      qualificationFound: String,
      registrationStatus: String,
      verificationResult: String
    },
    registrationCouncil: { type: String, default: 'National Medical Commission' },
    
    applicationSubmittedAt: { type: Date },
    reviewStartedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },

    // Old document array kept for backwards compatibility but we will use DoctorDocument model
    documents: [{
        title: String, 
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
    isAcceptingPatients: { type: Boolean, default: false }, // Should default to false until approved
    totalPatients: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletionReason: { type: String, default: null },
  },
  { timestamps: true }
);

// We should map old licenseNumber to medicalLicenseNumber for backward compatibility if code uses licenseNumber
doctorSchema.virtual('licenseNumber').get(function() { return this.medicalLicenseNumber; }).set(function(val) { this.medicalLicenseNumber = val; });
doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

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
