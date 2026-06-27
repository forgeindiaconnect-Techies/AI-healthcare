const MedicalReport = require('../models/MedicalReport');
const Patient = require('../models/Patient');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const aiService = require('../services/aiService');
const notificationService = require('../services/notificationService');
const { deleteFile } = require('../config/cloudinary');
const User = require('../models/User');

// @desc    Get reports
// @route   GET /api/reports
// @access  Private
exports.getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, reportType, status, patientId } = req.query;
  const query = { isArchived: false };

  if (req.user.role === 'patient') {
    query.patient = req.user.id;
  } else if (req.user.role === 'doctor') {
    // Doctors see reports shared with them
    query.sharedWith = req.user.id;
    if (patientId) query.patient = patientId;
  } else if (req.user.role === 'admin' && patientId) {
    query.patient = patientId;
  }

  if (reportType) query.reportType = reportType;
  if (status) query.status = status;

  const total = await MedicalReport.countDocuments(query);
  const reports = await MedicalReport.find(query)
    .populate('patient', 'name email avatar')
    .populate('uploadedBy', 'name role')
    .sort({ reportDate: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    count: reports.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: reports,
  });
});

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
exports.getReport = asyncHandler(async (req, res, next) => {
  const report = await MedicalReport.findById(req.params.id)
    .populate('patient', 'name email avatar')
    .populate('uploadedBy', 'name role')
    .populate('sharedWith', 'name email');

  if (!report) return next(new ErrorResponse('Report not found', 404));

  // Access control
  const isPatient = req.user.role === 'patient' && report.patient._id.toString() === req.user.id;
  const isSharedDoctor = req.user.role === 'doctor' && report.sharedWith.some(d => d._id.toString() === req.user.id);
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isSharedDoctor && !isAdmin) {
    return next(new ErrorResponse('Not authorized to view this report', 403));
  }

  res.status(200).json({ success: true, data: report });
});

// @desc    Upload medical report
// @route   POST /api/reports
// @access  Private
exports.uploadReport = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ErrorResponse('Please upload a file', 400));

  const { title, reportType, description, reportDate, labName, doctorName, appointmentId } = req.body;
  const patientId = req.user.role === 'patient' ? req.user.id : req.body.patientId;

    const fileUrl = req.file.path && req.file.path.startsWith('http') 
      ? req.file.path 
      : `/uploads/${req.file.filename}`;

  const report = await MedicalReport.create({
    patient: patientId,
    uploadedBy: req.user.id,
    appointment: appointmentId,
    title,
    reportType,
    description,
    fileUrl: fileUrl,
    filePublicId: req.file.filename,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    reportDate: reportDate ? new Date(reportDate) : new Date(),
    labName,
    doctorName,
  });

  // Update patient counter
  await Patient.findOneAndUpdate({ user: patientId }, { $inc: { totalReports: 1 } });

  // Notification
  await notificationService.reportUploaded(patientId, title);

  res.status(201).json({ success: true, message: 'Report uploaded successfully', data: report });
});

// @desc    AI analyze report
// @route   POST /api/reports/:id/analyze
// @access  Private
exports.analyzeReport = asyncHandler(async (req, res, next) => {
  const report = await MedicalReport.findById(req.params.id).populate('patient', 'name dateOfBirth gender');
  if (!report) return next(new ErrorResponse('Report not found', 404));

  // Authorization
  if (req.user.role === 'patient' && report.patient._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // Run AI analysis
  const reportData = {
    reportType: report.reportType,
    title: report.title,
    labName: report.labName,
    reportDate: report.reportDate,
    description: report.description,
    filePublicId: report.filePublicId,
    mimeType: report.mimeType
  };

  const analysis = await aiService.summarizeReport(reportData);

  // Save analysis to report
  report.aiAnalysis = {
    summary: analysis.summary,
    keyFindings: analysis.keyFindings || [],
    recommendations: analysis.recommendations || [],
    riskLevel: analysis.riskLevel || 'low',
    analyzedAt: new Date(),
    model: 'claude-sonnet-4-6',
  };
  report.status = analysis.riskLevel === 'critical' ? 'critical' : 'reviewed';
  await report.save();

  // Alert if critical
  if (analysis.riskLevel === 'critical') {
    const patient = await User.findById(report.patient._id);
    await notificationService.criticalReportAlert(patient, report);
  }

  res.status(200).json({ success: true, message: 'Report analyzed', data: { report, analysis } });
});

// @desc    Share report with doctor
// @route   PUT /api/reports/:id/share
// @access  Private (patient)
exports.shareReport = asyncHandler(async (req, res, next) => {
  const { doctorId } = req.body;
  const report = await MedicalReport.findOne({ _id: req.params.id, patient: req.user.id });
  if (!report) return next(new ErrorResponse('Report not found', 404));

  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  if (!report.sharedWith.includes(doctorId)) {
    report.sharedWith.push(doctorId);
    report.isSharedWithDoctor = true;
    await report.save();
  }

  res.status(200).json({ success: true, message: 'Report shared with doctor' });
});

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
exports.updateReport = asyncHandler(async (req, res, next) => {
  const report = await MedicalReport.findById(req.params.id);
  if (!report) return next(new ErrorResponse('Report not found', 404));

  if (req.user.role === 'patient' && report.patient.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const allowedUpdates = ['title', 'description', 'tags', 'status', 'reportDate'];
  const updates = {};
  allowedUpdates.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const updated = await MedicalReport.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.status(200).json({ success: true, data: updated });
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
exports.deleteReport = asyncHandler(async (req, res, next) => {
  const report = await MedicalReport.findById(req.params.id);
  if (!report) return next(new ErrorResponse('Report not found', 404));

  if (req.user.role === 'patient' && report.patient.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // Delete from Cloudinary
  if (report.filePublicId) {
    try { await deleteFile(report.filePublicId); } catch (e) { /* non-blocking */ }
  }

  await report.deleteOne();
  await Patient.findOneAndUpdate({ user: report.patient }, { $inc: { totalReports: -1 } });

  res.status(200).json({ success: true, message: 'Report deleted' });
});
