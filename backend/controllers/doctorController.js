const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorDocument = require('../models/DoctorDocument');
const DoctorVerificationHistory = require('../models/DoctorVerificationHistory');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all doctors (public)
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, specialization, search, minRating, isAcceptingPatients } = req.query;

  // Build doctor profile query
  const profileQuery = { status: 'Approved' };
  if (specialization) profileQuery.specialization = { $regex: specialization, $options: 'i' };
  if (minRating) profileQuery.rating = { $gte: Number(minRating) };
  if (isAcceptingPatients !== undefined) profileQuery.isAcceptingPatients = isAcceptingPatients === 'true';

  // User query for search
  let userIds;
  if (search) {
    const users = await User.find({
      role: 'doctor',
      isActive: true,
      name: { $regex: search, $options: 'i' },
    }).select('_id');
    userIds = users.map((u) => u._id);
    
    // Either name matches OR specialization matches
    profileQuery.$or = [
      { user: { $in: userIds } },
      { specialization: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await Doctor.countDocuments(profileQuery);
  const doctorProfiles = await Doctor.find(profileQuery)
    .populate('user', 'name email avatar phone')
    .sort({ rating: -1, experience: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    count: doctorProfiles.length,
    total,
    pages: Math.ceil(total / limit),
    data: doctorProfiles,
  });
});

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctor = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id, role: 'doctor' }).select('-password');
  if (!user) return next(new ErrorResponse('Doctor not found', 404));

  const doctorProfile = await Doctor.findOne({ user: req.params.id })
    .populate('user', 'name email avatar phone dateOfBirth gender');

  if (doctorProfile && doctorProfile.status !== 'Approved') {
    return next(new ErrorResponse('Doctor is not approved to accept patients', 403));
  }

  res.status(200).json({ success: true, data: { user, profile: doctorProfile } });
});

// @desc    Get doctor profile (own)
// @route   GET /api/doctors/profile/me
// @access  Private (doctor)
exports.getDoctorProfile = asyncHandler(async (req, res, next) => {
  const profile = await Doctor.findOne({ user: req.user.id })
    .populate('user', 'name email avatar phone dateOfBirth gender address');
  if (!profile) return next(new ErrorResponse('Doctor profile not found', 404));
  res.status(200).json({ success: true, data: profile });
});

// @desc    Get doctor profile data flat format
// @route   GET /api/doctors/profile
// @access  Private (doctor)
exports.getDoctorProfileData = asyncHandler(async (req, res, next) => {
  const profile = await Doctor.findOne({ user: req.user.id }).populate('user', 'name email');
  if (!profile) return next(new ErrorResponse('Doctor profile not found', 404));

  res.status(200).json({
    fullName: profile.user.name,
    email: profile.user.email,
    specialization: profile.specialization,
    experience: profile.experience
  });
});

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private (doctor)
exports.updateDoctorProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'specialization', 'subSpecialties', 'experience', 'education', 'certifications',
    'hospital', 'clinicAddress', 'consultationFee', 'consultationDuration',
    'availability', 'bio', 'languages', 'offDays', 
    'qualification', 'medicalCollege', 'graduationYear', 'medicalLicenseNumber', 
    'medicalCouncil', 'licenseState', 'licenseCountry', 'licenseIssueDate', 'licenseExpiryDate'
  ];

  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const profile = await Doctor.findOneAndUpdate({ user: req.user.id }, updates, { new: true, runValidators: true })
    .populate('user', 'name email avatar phone');

  if (!profile) return next(new ErrorResponse('Doctor profile not found', 404));
  res.status(200).json({ success: true, message: 'Profile updated', data: profile });
});

// @desc    Get doctor dashboard
// @route   GET /api/doctors/dashboard
// @access  Private (doctor)
exports.getDoctorDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayAppointments, pendingAppointments, totalPatients, weeklyStats] = await Promise.all([
    Appointment.find({ doctor: req.user.id, appointmentDate: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } })
      .populate('patient', 'name email avatar phone').sort({ appointmentTime: 1 }),
    Appointment.countDocuments({ doctor: req.user.id, status: 'pending' }),
    Appointment.distinct('patient', { doctor: req.user.id, status: 'completed' }),
    // Weekly appointments (last 7 days)
    Appointment.aggregate([
      { $match: { doctor: require('mongoose').Types.ObjectId.createFromHexString(req.user.id), createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const doctorProfile = await Doctor.findOne({ user: req.user.id });

  res.status(200).json({
    success: true,
    data: {
      todayAppointments,
      stats: {
        todayCount: todayAppointments.length,
        pendingCount: pendingAppointments,
        totalPatients: totalPatients.length,
        rating: doctorProfile?.rating || 0,
        totalRatings: doctorProfile?.totalRatings || 0,
      },
      weeklyStats,
    },
  });
});

// @desc    Get doctor's patients
// @route   GET /api/doctors/patients
// @access  Private (doctor)
exports.getDoctorPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  // Get unique patient IDs who had appointments with this doctor
  const patientIds = await Appointment.distinct('patient', { doctor: req.user.id });

  const query = { _id: { $in: patientIds }, role: 'patient' };
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const total = await User.countDocuments(query);
  const patients = await User.find(query)
    .select('-password')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  // Get visit count for each patient
  const patientsWithStats = await Promise.all(
    patients.map(async (patient) => {
      const visitCount = await Appointment.countDocuments({ doctor: req.user.id, patient: patient._id, status: 'completed' });
      const lastVisit = await Appointment.findOne({ doctor: req.user.id, patient: patient._id, status: 'completed' }).sort({ appointmentDate: -1 });
      return { ...patient.toObject(), visitCount, lastVisit: lastVisit?.appointmentDate };
    })
  );

  res.status(200).json({ success: true, count: patients.length, total, data: patientsWithStats });
});

// @desc    Rate a doctor
// @route   POST /api/doctors/:id/rate
// @access  Private (patient)
exports.rateDoctor = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return next(new ErrorResponse('Rating must be between 1 and 5', 400));

  // Verify patient has completed appointment with this doctor
  const hasAppointment = await Appointment.findOne({
    patient: req.user.id,
    doctor: req.params.id,
    status: 'completed',
  });

  if (!hasAppointment) {
    return next(new ErrorResponse('You can only rate doctors after a completed appointment', 403));
  }

  const doctorProfile = await Doctor.findOne({ user: req.params.id });
  if (!doctorProfile) return next(new ErrorResponse('Doctor not found', 404));

  await doctorProfile.addReview(req.user.id, rating, comment);

  res.status(200).json({
    success: true,
    message: 'Review submitted',
    data: { rating: doctorProfile.rating, totalRatings: doctorProfile.totalRatings },
  });
});

// @desc    Get specializations list
// @route   GET /api/doctors/specializations
// @access  Public
exports.getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Doctor.distinct('specialization');
  res.status(200).json({ success: true, data: specializations });
});

// @desc    Get Doctor Verification Status and Documents
// @route   GET /api/doctors/verification-status
// @access  Private (doctor)
exports.getVerificationStatus = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) return next(new ErrorResponse('Doctor profile not found', 404));

  const documents = await DoctorDocument.find({ doctor: doctor._id }).sort({ uploadedAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      status: doctor.status,
      medicalLicenseVerificationStatus: doctor.medicalLicenseVerificationStatus,
      rejectionReason: doctor.rejectionReason,
      documents
    }
  });
});

// @desc    Upload Doctor Document
// @route   POST /api/doctors/documents
// @access  Private (doctor)
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  const { documentType } = req.body;
  
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }
  if (!documentType) {
    return next(new ErrorResponse('Please provide documentType', 400));
  }

  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) return next(new ErrorResponse('Doctor profile not found', 404));

  // If there's an existing document of this type, we can mark it as REUPLOADED or just create a new one and delete old. 
  // For simplicity, we keep history. 
  
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/documents/${req.file.filename}`;

  const document = await DoctorDocument.create({
    doctor: doctor._id,
    documentType,
    originalFileName: req.file.originalname,
    storageKey: req.file.filename,
    fileUrl,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    verificationStatus: 'PENDING'
  });

  res.status(201).json({
    success: true,
    data: document
  });
});

// @desc    Submit Application for Verification
// @route   POST /api/doctors/submit-verification
// @access  Private (doctor)
exports.submitVerification = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) return next(new ErrorResponse('Doctor profile not found', 404));

  if (doctor.status === 'APPROVED') {
    return next(new ErrorResponse('Account is already approved', 400));
  }

  // Check if mandatory documents exist
  const requiredDocTypes = ['IDENTITY_PROOF', 'MEDICAL_LICENSE', 'MEDICAL_DEGREE', 'SPECIALIZATION_CERTIFICATE'];
  const docs = await DoctorDocument.find({ doctor: doctor._id, verificationStatus: { $ne: 'REJECTED' } });
  const uploadedTypes = docs.map(d => d.documentType);

  const missingDocs = requiredDocTypes.filter(type => !uploadedTypes.includes(type));
  if (missingDocs.length > 0) {
    return next(new ErrorResponse(`Missing required documents: ${missingDocs.join(', ')}`, 400));
  }

  const previousStatus = doctor.status;
  doctor.status = 'PENDING';
  doctor.applicationSubmittedAt = new Date();
  await doctor.save();

  await DoctorVerificationHistory.create({
    doctor: doctor._id,
    action: 'SUBMITTED',
    previousStatus,
    newStatus: 'PENDING',
    performedBy: req.user.id,
    performedByRole: 'DOCTOR',
    remarks: 'Application submitted for admin review.'
  });

  res.status(200).json({
    success: true,
    message: 'Application submitted successfully',
    data: { status: doctor.status }
  });
});
