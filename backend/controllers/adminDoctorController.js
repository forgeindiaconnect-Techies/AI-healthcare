const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorDocument = require('../models/DoctorDocument');
const DoctorVerificationHistory = require('../models/DoctorVerificationHistory');
const MedicalLicenceVerification = require('../models/MedicalLicenceVerification');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const notificationService = require('../services/notificationService');
const medicalLicenseService = require('../services/medicalLicenseService');
const mongoose = require('mongoose');

// @desc    Create a new doctor (Admin)
// @route   POST /api/admin/doctors
// @access  Private (Admin)
exports.createDoctor = asyncHandler(async (req, res, next) => {
  const {
    name, email, phone, password, gender, dateOfBirth, address,
    specialization, qualification, experience, registrationNumber,
    hospitalName, consultationFee, status // Default 'DRAFT' or 'APPROVED' based on admin choice
  } = req.body;

  let user = await User.findOne({ email });
  if (user) return next(new ErrorResponse('User with this email already exists', 400));

  let existingDoctor = await Doctor.findOne({ medicalLicenseNumber: registrationNumber });
  if (existingDoctor) return next(new ErrorResponse('Doctor with this Medical Registration Number already exists', 400));

  const addressObj = typeof address === 'string' ? (address ? { city: address } : undefined) : address;

  user = await User.create({
    name, email, password, role: 'doctor', phone, gender, dateOfBirth, address: addressObj,
    isActive: true, isEmailVerified: true
  });

  const isVerified = status === 'APPROVED';

  try {
    const doctor = await Doctor.create({
      user: user._id,
      specialization,
      medicalLicenseNumber: registrationNumber,
      experience: experience || 0,
      qualification,
      hospital: { name: hospitalName },
      consultationFee: consultationFee || 0,
      status: status || 'DRAFT',
      isVerified,
      isAcceptingPatients: isVerified
    });

    await notificationService.createNotification({
      user: user._id,
      title: 'Doctor Account Created',
      message: 'Your doctor account has been successfully created by the administrator. You can now login.',
      type: 'system',
      priority: 'high'
    });

    res.status(201).json({ success: true, data: { user, profile: doctor } });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    return next(new ErrorResponse('Failed to create doctor profile: ' + error.message, 400));
  }
});

// @desc    Get all doctors for Admin
// @route   GET /api/admin/doctors
// @access  Private (Admin)
exports.getAllDoctors = asyncHandler(async (req, res, next) => {
  const { search, status, isVerified, includeDeleted } = req.query;

  let profileQuery = {};
  if (includeDeleted !== 'true') {
    profileQuery.isDeleted = { $ne: true };
  }

  if (status) {
    profileQuery.status = status;
  } else if (isVerified !== undefined) {
    if (isVerified === 'true') profileQuery.status = 'APPROVED';
    else profileQuery.status = { $ne: 'APPROVED' };
  }

  if (search) {
    const users = await User.find({
      role: 'doctor',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    profileQuery.user = { $in: users.map(u => u._id) };
  }

  const doctors = await Doctor.find(profileQuery)
    .populate('user', '-password')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: doctors.length, data: doctors });
});

// @desc    Get single doctor details for review
// @route   GET /api/admin/doctors/:id
// @access  Private (Admin)
exports.getDoctorForReview = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).populate('user', '-password');
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  const documents = await DoctorDocument.find({ doctor: doctor._id }).sort({ uploadedAt: -1 });
  const verificationHistory = await DoctorVerificationHistory.find({ doctor: doctor._id })
    .populate('performedBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { doctor, documents, verificationHistory } });
});

// @desc    Update doctor profile (Admin)
// @route   PUT /api/admin/doctors/:id
// @access  Private (Admin)
exports.updateDoctor = asyncHandler(async (req, res, next) => {
  const {
    name, email, phone, gender, address,
    specialization, qualification, experience, registrationNumber,
    hospitalName, consultationFee
  } = req.body;

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  const user = await User.findById(doctor.user);
  if (!user) return next(new ErrorResponse('User not found', 404));

  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (gender) user.gender = gender;
  if (address) user.address = address;
  await user.save();

  if (specialization) doctor.specialization = specialization;
  if (registrationNumber) doctor.medicalLicenseNumber = registrationNumber;
  if (experience !== undefined) doctor.experience = experience;
  if (qualification) doctor.qualification = qualification;
  if (hospitalName) doctor.hospital = { ...doctor.hospital, name: hospitalName };
  if (consultationFee !== undefined) doctor.consultationFee = consultationFee;

  await doctor.save();

  res.status(200).json({ success: true, data: { user, profile: doctor } });
});

// @desc    Soft delete doctor (Admin)
// @route   PATCH /api/admin/doctors/:id/remove
// @access  Private (Admin)
exports.removeDoctor = asyncHandler(async (req, res, next) => {
  const { reason, remarks } = req.body;
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  // Dependency checks
  const activeAppointments = await Appointment.countDocuments({
    doctor: doctor.user,
    status: { $in: ['Scheduled', 'Confirmed', 'Pending Doctor Approval', 'Approved - Payment Pending', 'Payment Completed', 'Meeting Scheduled', 'pending', 'confirmed'] },
    isDeleted: { $ne: true }
  });

  if (activeAppointments > 0) {
    return next(new ErrorResponse(`Cannot remove doctor because ${activeAppointments} active appointments are scheduled.`, 400));
  }

  const previousStatus = doctor.status;
  doctor.isDeleted = true;
  doctor.status = 'INACTIVE';
  doctor.isAcceptingPatients = false;
  doctor.deletedAt = new Date();
  doctor.deletedBy = req.user.id;
  doctor.deletionReason = reason || 'Not specified';
  await doctor.save();

  const user = await User.findById(doctor.user);
  if (user) {
    user.isDeleted = true;
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    user.deletionReason = reason || 'Not specified';
    await user.save();
  }

  const AuditLog = require('../models/AuditLog');
  await AuditLog.create({
    action: 'REMOVE',
    resourceType: 'Doctor',
    resourceId: doctor._id,
    previousStatus,
    newStatus: 'INACTIVE',
    performedBy: req.user.id,
    performedByRole: 'ADMIN',
    reason: reason || 'Not specified',
    remarks
  });

  res.status(200).json({ success: true, message: 'Doctor removed successfully' });
});

// @desc    Restore a soft-deleted doctor
// @route   PATCH /api/admin/doctors/:id/restore
// @access  Private (Admin)
exports.restoreDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  if (!doctor.isDeleted) {
    return next(new ErrorResponse('Doctor is not removed', 400));
  }

  const previousStatus = doctor.status;
  doctor.isDeleted = false;
  doctor.status = 'APPROVED'; // Or previous status if we tracked it, but typically APPROVED
  doctor.deletedAt = null;
  doctor.deletedBy = null;
  doctor.deletionReason = null;
  await doctor.save();

  const user = await User.findById(doctor.user);
  if (user) {
    user.isDeleted = false;
    user.isActive = true;
    user.deletedAt = null;
    user.deletedBy = null;
    user.deletionReason = null;
    await user.save();
  }

  const AuditLog = require('../models/AuditLog');
  await AuditLog.create({
    action: 'RESTORE',
    resourceType: 'Doctor',
    resourceId: doctor._id,
    previousStatus,
    newStatus: 'APPROVED',
    performedBy: req.user.id,
    performedByRole: 'ADMIN',
    reason: 'Restored from archived',
  });

  res.status(200).json({ success: true, message: 'Doctor restored successfully' });
});

// @desc    Start review
// @route   PATCH /api/admin/doctors/:id/start-review
// @access  Private (Admin)
exports.startReview = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  if (doctor.status === 'PENDING') {
    const previousStatus = doctor.status;
    doctor.status = 'UNDER_REVIEW';
    doctor.reviewStartedAt = new Date();
    await doctor.save();

    await DoctorVerificationHistory.create({
      doctor: doctor._id, action: 'REVIEW_STARTED', previousStatus, newStatus: 'UNDER_REVIEW',
      performedBy: req.user.id, performedByRole: 'ADMIN'
    });
  }

  res.status(200).json({ success: true, data: doctor });
});

// @desc    Verify/Reject/RequestReupload a document
// @route   PATCH /api/admin/doctors/:id/documents/:documentId/:action
// @access  Private (Admin)
exports.updateDocumentStatus = asyncHandler(async (req, res, next) => {
  const { id, documentId, action } = req.params; // action: 'verify', 'reject', 'request-reupload'
  const { remarks } = req.body;

  const document = await DoctorDocument.findOne({ _id: documentId, doctor: id });
  if (!document) return next(new ErrorResponse('Document not found', 404));

  let status, historyAction;
  if (action === 'verify') { status = 'VERIFIED'; historyAction = 'DOCUMENT_VERIFIED'; }
  else if (action === 'reject') { status = 'REJECTED'; historyAction = 'DOCUMENT_REJECTED'; }
  else if (action === 'request-reupload') { status = 'REUPLOAD_REQUIRED'; historyAction = 'DOCUMENT_REUPLOAD_REQUESTED'; }
  else return next(new ErrorResponse('Invalid action', 400));

  document.verificationStatus = status;
  if (remarks) document.adminRemarks = remarks;
  if (status === 'VERIFIED') {
    document.verifiedBy = req.user.id;
    document.verifiedAt = new Date();
  } else if (status === 'REJECTED') {
    document.rejectedAt = new Date();
  }
  await document.save();

  await DoctorVerificationHistory.create({
    doctor: id, action: historyAction, documentId,
    performedBy: req.user.id, performedByRole: 'ADMIN', remarks
  });

  res.status(200).json({ success: true, data: document });
});

// @desc    Verify Medical License
// @route   POST /api/admin/doctors/:id/verify-medical-license
// @access  Private (Admin)
exports.verifyMedicalLicense = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  const result = await medicalLicenseService.verifyLicense({
    doctorId: doctor._id,
    licenseNumber: doctor.medicalLicenseNumber,
    medicalCouncil: doctor.medicalCouncil,
    state: doctor.licenseState,
    country: doctor.licenseCountry
  });

  const record = await medicalLicenseService.saveVerificationResult(doctor._id, req.user.id, result, req.body.notes);

  doctor.medicalLicenseVerificationStatus = result.status;
  doctor.medicalLicenseVerificationMethod = 'API';
  doctor.medicalLicenseVerifiedName = result.registeredName;
  doctor.medicalLicenseVerifiedAt = new Date();
  doctor.medicalLicenseVerifiedBy = req.user.id;
  await doctor.save();

  await DoctorVerificationHistory.create({
    doctor: doctor._id, action: 'LICENSE_CHECKED', 
    performedBy: req.user.id, performedByRole: 'ADMIN',
    metadata: { licenseStatus: result.status }
  });

  res.status(200).json({ success: true, data: { result, record, doctor } });
});

// @desc    Approve/Reject/Suspend/RequestChanges
// @route   POST /api/admin/doctors/:id/:action
// @access  Private (Admin)
exports.updateDoctorStatus = asyncHandler(async (req, res, next) => {
  const { id, action } = req.params; // action: 'approve', 'reject', 'suspend', 'request-changes'
  const { reason, checklistChecked } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const doctor = await Doctor.findById(id).populate('user').session(session);
    if (!doctor) throw new ErrorResponse('Doctor not found', 404);

    const previousStatus = doctor.status;
    let newStatus, historyAction, isAcceptingPatients = false;

    if (action === 'approve') {
      if (!checklistChecked) throw new ErrorResponse('Checklist must be completed before approval', 400);
      
      const docs = await DoctorDocument.find({ doctor: id }).session(session);
      const required = ['IDENTITY_PROOF', 'MEDICAL_LICENSE', 'MEDICAL_DEGREE', 'SPECIALIZATION_CERTIFICATE'];
      const verifiedTypes = docs.filter(d => d.verificationStatus === 'VERIFIED').map(d => d.documentType);
      
      const missing = required.filter(r => !verifiedTypes.includes(r));
      if (missing.length > 0) throw new ErrorResponse(`Cannot approve. Missing verified documents: ${missing.join(', ')}`, 400);
      
      if (doctor.medicalLicenseVerificationStatus !== 'VERIFIED') throw new ErrorResponse('Medical license must be VERIFIED before approval', 400);

      newStatus = 'APPROVED';
      historyAction = 'APPROVED';
      isAcceptingPatients = true;
      doctor.approvedAt = new Date();
      doctor.approvedBy = req.user.id;
      doctor.isVerified = true;
    } else if (action === 'reject') {
      if (!reason) throw new ErrorResponse('Rejection reason is required', 400);
      newStatus = 'REJECTED';
      historyAction = 'REJECTED';
      doctor.rejectedAt = new Date();
      doctor.rejectedBy = req.user.id;
      doctor.rejectionReason = reason;
      doctor.isVerified = false;
    } else if (action === 'suspend') {
      if (!reason) throw new ErrorResponse('Suspension reason is required', 400);
      newStatus = 'SUSPENDED';
      historyAction = 'SUSPENDED';
      doctor.isVerified = false;
    } else if (action === 'request-changes') {
      if (!reason) throw new ErrorResponse('Reason is required', 400);
      newStatus = 'CHANGES_REQUESTED';
      historyAction = 'CHANGES_REQUESTED';
      doctor.isVerified = false;
    } else {
      throw new ErrorResponse('Invalid action', 400);
    }

    doctor.status = newStatus;
    doctor.isAcceptingPatients = isAcceptingPatients;
    await doctor.save({ session });

    await DoctorVerificationHistory.create([{
      doctor: doctor._id, action: historyAction, previousStatus, newStatus,
      performedBy: req.user.id, performedByRole: 'ADMIN', remarks: reason
    }], { session });

    if (doctor.user) {
      await notificationService.createNotification({
        user: doctor.user._id,
        title: `Doctor Application Status: ${newStatus}`,
        message: `Your account status has been updated to ${newStatus}. ${reason ? 'Reason: ' + reason : ''}`,
        type: 'system', priority: 'high'
      });
    }

    await session.commitTransaction();
    res.status(200).json({ success: true, data: doctor, message: `Doctor successfully updated to ${newStatus}` });
  } catch (err) {
    await session.abortTransaction();
    return next(err);
  } finally {
    session.endSession();
  }
});
