const User = require('../models/User');
const Doctor = require('../models/Doctor');
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
  const profileQuery = {};
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

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private (doctor)
exports.updateDoctorProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'specialization', 'subSpecialties', 'experience', 'education', 'certifications',
    'hospital', 'clinicAddress', 'consultationFee', 'consultationDuration',
    'availability', 'bio', 'languages', 'isAcceptingPatients', 'offDays',
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
