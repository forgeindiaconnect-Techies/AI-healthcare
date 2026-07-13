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
  let patient = await Patient.findOne({ user: req.user.id })
    .populate('user', 'name email phone avatar dateOfBirth gender address')
    .populate('preferredDoctor', 'name email');

  if (!patient) return next(new ErrorResponse('Patient profile not found', 404));

  // --- AUTO SEED DUMMY DATA FOR EMPTY PROFILES (FOR DEMO) ---
  if (!patient.bloodType && (!patient.vitals || patient.vitals.length === 0)) {
    patient.bloodType = 'O+';
    patient.height = 175;
    patient.weight = 72;
    patient.healthScore = 88;
    patient.allergies = ['Penicillin', 'Peanuts', 'Dust Mites'];
    patient.chronicConditions = ['Type 2 Diabetes', 'Mild Hypertension'];
    patient.vitals = [
      { date: new Date(Date.now() - 86400000 * 2), bloodPressure: { systolic: 125, diastolic: 82 }, heartRate: 74, temperature: 36.8, oxygenSaturation: 98, respiratoryRate: 16, glucoseLevel: 110 },
      { date: new Date(), bloodPressure: { systolic: 120, diastolic: 80 }, heartRate: 72, temperature: 37.0, oxygenSaturation: 99, respiratoryRate: 15, glucoseLevel: 105 }
    ];
    patient.currentMedications = [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', startDate: new Date(Date.now() - 86400000 * 30) },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', startDate: new Date(Date.now() - 86400000 * 60) },
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at night', startDate: new Date(Date.now() - 86400000 * 15) }
    ];
    await patient.save();
    
    // Re-fetch to ensure populated fields remain intact
    patient = await Patient.findOne({ user: req.user.id })
      .populate('user', 'name email phone avatar dateOfBirth gender address')
      .populate('preferredDoctor', 'name email');
  }

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
  const { page = 1, limit = 10, search, includeDeleted } = req.query;
  const query = { role: 'patient', isActive: true };
  if (includeDeleted !== 'true') {
    query.isDeleted = { $ne: true };
  }

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
  const { page = 1, limit = 15, role, search, isActive, includeDeleted } = req.query;
  const query = {};
  
  if (includeDeleted !== 'true') {
    query.isDeleted = { $ne: true };
  }

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

// @desc    Soft delete user (admin)
// @route   PATCH /api/admin/users/:id/remove
// @access  Private (admin)
exports.removeUser = asyncHandler(async (req, res, next) => {
  const { reason, remarks } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  if (user.role === 'admin') return next(new ErrorResponse('Cannot remove admin accounts', 403));

  let previousStatus = user.isActive ? 'ACTIVE' : 'INACTIVE';

  if (user.role === 'patient') {
    // Check for active appointments
    const activeAppointments = await Appointment.countDocuments({
      patient: user._id,
      status: { $in: ['Scheduled', 'Confirmed', 'Pending Doctor Approval', 'Approved - Payment Pending', 'Meeting Scheduled', 'pending', 'confirmed'] },
      isDeleted: { $ne: true }
    });

    if (activeAppointments > 0) {
      return next(new ErrorResponse(`Cannot remove patient because ${activeAppointments} active appointments exist.`, 400));
    }

    const patient = await Patient.findOne({ user: user._id });
    if (patient) {
      patient.isDeleted = true;
      patient.deletedAt = new Date();
      patient.deletedBy = req.user.id;
      patient.deletionReason = reason || 'Not specified';
      await patient.save();
    }
  }

  if (user.role === 'doctor') {
    return next(new ErrorResponse('Please use the Doctor Management page to remove doctors', 400));
  }

  user.isDeleted = true;
  user.isActive = false;
  user.deletedAt = new Date();
  user.deletedBy = req.user.id;
  user.deletionReason = reason || 'Not specified';
  await user.save();

  const AuditLog = require('../models/AuditLog');
  await AuditLog.create({
    action: 'REMOVE',
    resourceType: 'User',
    resourceId: user._id,
    previousStatus,
    newStatus: 'INACTIVE',
    performedBy: req.user.id,
    performedByRole: 'ADMIN',
    reason: reason || 'Not specified',
    remarks
  });

  res.status(200).json({ success: true, message: 'User removed successfully' });
});

// @desc    Restore user (admin)
// @route   PATCH /api/admin/users/:id/restore
// @access  Private (admin)
exports.restoreUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  if (!user.isDeleted) return next(new ErrorResponse('User is not removed', 400));

  let previousStatus = 'INACTIVE';
  user.isDeleted = false;
  user.isActive = true;
  user.deletedAt = null;
  user.deletedBy = null;
  user.deletionReason = null;
  await user.save();

  if (user.role === 'patient') {
    const patient = await Patient.findOne({ user: user._id });
    if (patient) {
      patient.isDeleted = false;
      patient.deletedAt = null;
      patient.deletedBy = null;
      patient.deletionReason = null;
      await patient.save();
    }
  }

  const AuditLog = require('../models/AuditLog');
  await AuditLog.create({
    action: 'RESTORE',
    resourceType: 'User',
    resourceId: user._id,
    previousStatus,
    newStatus: 'ACTIVE',
    performedBy: req.user.id,
    performedByRole: 'ADMIN',
    reason: 'Restored from archived'
  });

  res.status(200).json({ success: true, message: 'User restored successfully' });
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

// @desc    Get all archived/soft-deleted records (AuditLogs)
// @route   GET /api/admin/archived
// @access  Private (admin)
exports.getArchivedRecords = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const AuditLog = require('../models/AuditLog');
  
  const query = {};
  if (req.query.resourceType) query.resourceType = req.query.resourceType;
  if (req.query.action) query.action = req.query.action;
  else query.action = { $in: ['REMOVE', 'REMOVE_REPORT', 'VOID_PRESCRIPTION', 'ARCHIVE_PAYMENT', 'CANCEL_APPOINTMENT', 'REMOVE_MEDICAL_REPORT', 'REMOVE_USER', 'REMOVE_NOTIFICATION'] };

  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('performedBy', 'name email role')
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
