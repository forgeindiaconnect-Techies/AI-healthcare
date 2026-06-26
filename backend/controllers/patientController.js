const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalReport = require('../models/MedicalReport');
const Prescription = require('../models/Prescription');
const { Notification, ActivityLog } = require('../models/index');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// ============================
// PATIENT CONTROLLER
// ============================

// @desc    Get patient profile
// @route   GET /api/patients/profile
// @access  Private (patient)
exports.getPatientProfile = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({ user: req.user.id })
    .populate('user', 'name email phone avatar dateOfBirth gender address')
    .populate('preferredDoctor', 'name email');

  if (!patient) return next(new ErrorResponse('Patient profile not found', 404));
  res.status(200).json({ success: true, data: patient });
});

// @desc    Update patient profile
// @route   PUT /api/patients/profile
// @access  Private (patient)
exports.updatePatientProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'bloodType', 'height', 'weight', 'allergies', 'chronicConditions',
    'emergencyContact', 'insuranceInfo', 'smokingStatus', 'alcoholConsumption',
    'exerciseFrequency', 'medicalHistory', 'surgicalHistory', 'familyHistory', 'vaccinationRecord',
  ];

  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const patient = await Patient.findOneAndUpdate({ user: req.user.id }, updates, { new: true, runValidators: true })
    .populate('user', 'name email phone avatar dateOfBirth gender');

  if (!patient) return next(new ErrorResponse('Patient profile not found', 404));
  res.status(200).json({ success: true, message: 'Profile updated', data: patient });
});

// @desc    Add vitals
// @route   POST /api/patients/vitals
// @access  Private
exports.addVitals = asyncHandler(async (req, res, next) => {
  const { bloodPressure, heartRate, temperature, oxygenSaturation, glucoseLevel, weight, notes } = req.body;
  const targetUser = req.user.role === 'doctor' ? req.body.patientId : req.user.id;

  const patient = await Patient.findOne({ user: targetUser });
  if (!patient) return next(new ErrorResponse('Patient not found', 404));

  patient.vitals.push({
    bloodPressure, heartRate, temperature, oxygenSaturation, glucoseLevel, weight, notes,
    recordedBy: req.user.id,
    date: new Date(),
  });

  // Keep only last 30 vitals
  if (patient.vitals.length > 30) {
    patient.vitals = patient.vitals.slice(-30);
  }

  await patient.save();
  res.status(201).json({ success: true, message: 'Vitals recorded', data: patient.vitals.slice(-1)[0] });
});

// @desc    Get vitals history
// @route   GET /api/patients/vitals
// @access  Private
exports.getVitals = asyncHandler(async (req, res, next) => {
  const targetUser = req.query.patientId || req.user.id;
  const patient = await Patient.findOne({ user: targetUser }).select('vitals');
  if (!patient) return next(new ErrorResponse('Patient not found', 404));
  res.status(200).json({ success: true, data: patient.vitals });
});

// @desc    Get patient dashboard stats
// @route   GET /api/patients/dashboard
// @access  Private (patient)
exports.getPatientDashboard = asyncHandler(async (req, res) => {
  const [appointments, reports, prescriptions, patient] = await Promise.all([
    Appointment.find({ patient: req.user.id }).sort({ appointmentDate: -1 }).limit(5)
      .populate('doctor', 'name email avatar'),
    MedicalReport.find({ patient: req.user.id, isArchived: false }).sort({ reportDate: -1 }).limit(5),
    Prescription.find({ patient: req.user.id, status: 'active' }).sort({ createdAt: -1 }).limit(3)
      .populate('doctor', 'name'),
    Patient.findOne({ user: req.user.id }),
  ]);

  const stats = {
    totalAppointments: await Appointment.countDocuments({ patient: req.user.id }),
    upcomingAppointments: await Appointment.countDocuments({ patient: req.user.id, status: { $in: ['pending', 'confirmed'] }, appointmentDate: { $gte: new Date() } }),
    totalReports: await MedicalReport.countDocuments({ patient: req.user.id }),
    activePrescriptions: await Prescription.countDocuments({ patient: req.user.id, status: 'active' }),
    healthScore: patient?.healthScore || 75,
    latestVitals: patient?.vitals?.slice(-1)[0] || null,
  };

  res.status(200).json({ success: true, data: { stats, recentAppointments: appointments, recentReports: reports, activePrescriptions: prescriptions } });
});

// @desc    Get patient treatment plans
// @route   GET /api/patients/treatment-plans
// @access  Private (patient)
exports.getPatientTreatmentPlans = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({ user: req.user.id });
  if (!patient) return next(new ErrorResponse('Patient not found', 404));

  const TreatmentPlan = require('../models/TreatmentPlan');
  const plans = await TreatmentPlan.find({ patient: patient._id })
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name avatar' }
    })
    .sort({ startDate: -1 });

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans
  });
});

// @desc    Get all patients (doctor/admin)
// @route   GET /api/patients
// @access  Private (doctor, admin)
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const query = { role: 'patient', isActive: true };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const patients = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({ success: true, count: patients.length, total, data: patients });
});

// ============================
// ADMIN CONTROLLER
// ============================

// @desc    Admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (admin)
exports.getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalPatients, totalDoctors, totalAppointments,
    totalReports, pendingAppointments, recentUsers, activityLogs,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'patient', isActive: true }),
    User.countDocuments({ role: 'doctor', isActive: true }),
    Appointment.countDocuments(),
    MedicalReport.countDocuments(),
    Appointment.countDocuments({ status: 'pending' }),
    User.find().select('-password').sort({ createdAt: -1 }).limit(10),
    ActivityLog.find().sort({ createdAt: -1 }).limit(20).populate('user', 'name role'),
  ]);

  // Monthly stats (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyAppointments = await Appointment.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthlyUsers = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, role: '$role' }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: { totalUsers, totalPatients, totalDoctors, totalAppointments, totalReports, pendingAppointments },
      recentUsers,
      activityLogs,
      charts: { monthlyAppointments, monthlyUsers },
    },
  });
});

// @desc    Manage all users
// @route   GET /api/admin/users
// @access  Private (admin)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, role, search, isActive } = req.query;
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const total = await User.countDocuments(query);
  const users = await User.find(query).select('-password').sort({ createdAt: -1 })
    .skip((page - 1) * limit).limit(Number(limit));

  res.status(200).json({ success: true, count: users.length, total, pages: Math.ceil(total / limit), data: users });
});

// @desc    Suspend/activate user
// @route   PUT /api/admin/users/:id/status
// @access  Private (admin)
exports.toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  if (user.role === 'admin') return next(new ErrorResponse('Cannot suspend admin accounts', 403));

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'suspended'}`,
    data: { isActive: user.isActive },
  });
});

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  if (user.role === 'admin') return next(new ErrorResponse('Cannot delete admin accounts', 403));

  // Clean up related data
  if (user.role === 'patient') await Patient.findOneAndDelete({ user: user._id });
  if (user.role === 'doctor') await Doctor.findOneAndDelete({ user: user._id });

  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted' });
});

// @desc    Get activity logs
// @route   GET /api/admin/activity-logs
// @access  Private (admin)
exports.getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, userId, action } = req.query;
  const query = {};
  if (userId) query.user = userId;
  if (action) query.action = action;

  const total = await ActivityLog.countDocuments(query);
  const logs = await ActivityLog.find(query)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, data: logs });
});

// @desc    System analytics
// @route   GET /api/admin/analytics
// @access  Private (admin)
exports.getAnalytics = asyncHandler(async (req, res) => {
  const [
    appointmentsByStatus,
    appointmentsByType,
    reportsByType,
    doctorRatings,
  ] = await Promise.all([
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    MedicalReport.aggregate([{ $group: { _id: '$reportType', count: { $sum: 1 } } }]),
    Doctor.find().select('rating totalRatings totalPatients specialization').populate('user', 'name').sort({ rating: -1 }).limit(10),
  ]);

  res.status(200).json({
    success: true,
    data: { appointmentsByStatus, appointmentsByType, reportsByType, topDoctors: doctorRatings },
  });
});
