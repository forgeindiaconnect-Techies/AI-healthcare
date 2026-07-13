// ============================
// PRESCRIPTION CONTROLLER
// ============================
const Prescription = require('../models/Prescription');
const { MedicineReminder } = require('../models/index');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const notificationService = require('../services/notificationService');

// @desc    Get prescriptions
// @route   GET /api/prescriptions
// @access  Private
exports.getPrescriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, patientId } = req.query;
  const query = {};

  if (req.user.role === 'patient') query.patient = req.user.id;
  else if (req.user.role === 'doctor') {
    query.doctor = req.user.id;
    if (patientId) query.patient = patientId;
  } else if (req.user.role === 'admin' && patientId) {
    query.patient = patientId;
  }

  if (status) query.status = status;

  const total = await Prescription.countDocuments(query);
  const prescriptions = await Prescription.find(query)
    .populate('patient', 'name email avatar')
    .populate('doctor', 'name email avatar')
    .populate('appointment', 'appointmentDate appointmentTime type')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({ success: true, count: prescriptions.length, total, data: prescriptions });
});

// @desc    Create prescription (doctor only)
// @route   POST /api/prescriptions
// @access  Private (doctor)
exports.createPrescription = asyncHandler(async (req, res, next) => {
  const { patient: patientId, diagnosis, medicines, labTests, instructions, followUpDate, appointmentId, validUntil } = req.body;

  const patient = await User.findOne({ _id: patientId, role: 'patient' });
  if (!patient) return next(new ErrorResponse('Patient not found', 404));

  const prescription = await Prescription.create({
    patient: patientId,
    doctor: req.user.id,
    appointment: appointmentId,
    diagnosis,
    medicines,
    labTests: labTests || [],
    instructions,
    followUpDate,
    validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  // If linked to appointment, update it
  if (appointmentId) {
    await Appointment.findByIdAndUpdate(appointmentId, { prescription: prescription._id });
  }

  // Notification
  await notificationService.prescriptionCreated(patient, req.user, prescription);

  const populated = await prescription.populate([
    { path: 'patient', select: 'name email' },
    { path: 'doctor', select: 'name email' },
  ]);

  res.status(201).json({ success: true, message: 'Prescription created', data: populated });
});

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
exports.getPrescription = asyncHandler(async (req, res, next) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient', 'name email avatar phone dateOfBirth gender')
    .populate('doctor', 'name email avatar')
    .populate('appointment');

  if (!prescription) return next(new ErrorResponse('Prescription not found', 404));

  const isOwner = prescription.patient._id.toString() === req.user.id;
  const isDoctor = prescription.doctor._id.toString() === req.user.id;
  if (!isOwner && !isDoctor && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  res.status(200).json({ success: true, data: prescription });
});

// @desc    Update prescription status
// @route   PUT /api/prescriptions/:id
// @access  Private (doctor)
exports.updatePrescription = asyncHandler(async (req, res, next) => {
  const prescription = await Prescription.findOne({ _id: req.params.id, doctor: req.user.id });
  if (!prescription) return next(new ErrorResponse('Prescription not found or not authorized', 404));

  const allowedUpdates = ['status', 'instructions', 'followUpDate', 'pharmacyNotes'];
  allowedUpdates.forEach((f) => { if (req.body[f] !== undefined) prescription[f] = req.body[f]; });
  await prescription.save();

  res.status(200).json({ success: true, data: prescription });
});

// @desc    Void (remove) prescription
// @route   PATCH /api/prescriptions/:id/void
// @access  Private (Doctor, Admin)
exports.voidPrescription = asyncHandler(async (req, res, next) => {
  const { reason, remarks } = req.body;
  const prescription = await Prescription.findById(req.params.id);
  
  if (!prescription) return next(new ErrorResponse('Prescription not found', 404));

  if (req.user.role === 'doctor' && prescription.doctor.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to void this prescription', 403));
  }

  const previousStatus = prescription.status;

  prescription.status = 'VOID';
  prescription.isDeleted = true;
  prescription.deletedAt = new Date();
  prescription.deletedBy = req.user.id;
  prescription.deletionReason = reason || 'Not specified';
  
  await prescription.save();

  const AuditLog = require('../models/AuditLog');
  await AuditLog.create({
    action: 'VOID_PRESCRIPTION',
    resourceType: 'Prescription',
    resourceId: prescription._id,
    previousStatus,
    newStatus: 'VOID',
    performedBy: req.user.id,
    performedByRole: req.user.role.toUpperCase(),
    reason: reason || 'Not specified',
    remarks
  });

  res.status(200).json({ success: true, message: 'Prescription voided successfully' });
});

// ============================
// MEDICINE REMINDER CONTROLLER
// ============================
exports.getReminders = asyncHandler(async (req, res) => {
  const reminders = await MedicineReminder.find({ patient: req.user.id, isActive: true })
    .populate('prescription', 'prescriptionNumber diagnosis')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: reminders });
});

exports.createReminder = asyncHandler(async (req, res, next) => {
  const { medicineName, dosage, frequency, times, startDate, endDate, instructions, prescriptionId } = req.body;
  if (!medicineName || !frequency || !startDate) {
    return next(new ErrorResponse('Medicine name, frequency, and start date are required', 400));
  }

  const reminder = await MedicineReminder.create({
    patient: req.user.id,
    prescription: prescriptionId,
    medicineName,
    dosage,
    frequency,
    times: times || [],
    startDate,
    endDate,
    instructions,
  });

  res.status(201).json({ success: true, message: 'Reminder created', data: reminder });
});

exports.logAdherence = asyncHandler(async (req, res, next) => {
  const { scheduledTime, status, notes } = req.body;
  const reminder = await MedicineReminder.findOne({ _id: req.params.id, patient: req.user.id });
  if (!reminder) return next(new ErrorResponse('Reminder not found', 404));

  reminder.adherenceLog.push({ scheduledTime, takenAt: status === 'taken' ? new Date() : null, status, notes });

  // Calculate adherence rate
  const taken = reminder.adherenceLog.filter((l) => l.status === 'taken').length;
  reminder.adherenceRate = Math.round((taken / reminder.adherenceLog.length) * 100);

  await reminder.save();
  res.status(200).json({ success: true, data: reminder });
});

exports.deleteReminder = asyncHandler(async (req, res, next) => {
  const reminder = await MedicineReminder.findOneAndDelete({ _id: req.params.id, patient: req.user.id });
  if (!reminder) return next(new ErrorResponse('Reminder not found', 404));
  res.status(200).json({ success: true, message: 'Reminder deleted' });
});
