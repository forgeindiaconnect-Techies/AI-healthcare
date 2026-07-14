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

    if (user) {
      await notificationService.create({
        userId: user._id,
        title: 'Doctor Account Created',
        message: 'Your doctor account has been created by an administrator. Please check your email for login details.',
        type: 'system', priority: 'high'
      });
    } 
    
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

// @desc    View secure document url
// @route   GET /api/admin/doctors/:doctorId/documents/:documentId/view
// @access  Private (Admin)
exports.viewDocument = asyncHandler(async (req, res, next) => {
  const { doctorId, documentId } = req.params;
  
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const document = await DoctorDocument.findOne({ _id: documentId, doctor: doctorId });
  if (!document) {
    return next(new ErrorResponse('Document not found', 404));
  }

  res.status(200).json({
    success: true,
    document: {
      id: document._id,
      name: document.documentType.replace(/_/g, ' '),
      fileName: document.originalFileName,
      mimeType: document.mimeType || (document.fileUrl.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      uploadedAt: document.uploadedAt,
      previewUrl: document.fileUrl
    }
  });
});

// @desc    Verify document
// @route   PATCH /api/admin/doctors/:doctorId/documents/:documentId/verify
// @access  Private (Admin)
exports.verifyDocument = asyncHandler(async (req, res, next) => {
  const { doctorId, documentId } = req.params;
  const { remarks } = req.body;

  const document = await DoctorDocument.findOne({ _id: documentId, doctor: doctorId });
  if (!document) return next(new ErrorResponse('Document not found', 404));

  document.verificationStatus = 'verified';
  if (remarks) document.adminRemarks = remarks;
  document.verifiedBy = req.user.id;
  document.verifiedAt = new Date();
  await document.save();

  await DoctorVerificationHistory.create({
    doctor: doctorId, action: 'DOCUMENT_VERIFIED', documentId,
    performedBy: req.user.id, performedByRole: 'ADMIN', remarks
  });

  res.status(200).json({ success: true, data: document });
});

// @desc    Request changes for a document
// @route   PATCH /api/admin/doctors/:doctorId/documents/:documentId/request-changes
// @access  Private (Admin)
exports.requestChangesDocument = asyncHandler(async (req, res, next) => {
  const { doctorId, documentId } = req.params;
  const { reason } = req.body;

  if (!reason) return next(new ErrorResponse('Reason is required', 400));

  const document = await DoctorDocument.findOne({ _id: documentId, doctor: doctorId });
  if (!document) return next(new ErrorResponse('Document not found', 404));

  document.verificationStatus = 'changes_requested';
  document.adminRemarks = reason;
  await document.save();

  await DoctorVerificationHistory.create({
    doctor: doctorId, action: 'DOCUMENT_CHANGES_REQUESTED', documentId,
    performedBy: req.user.id, performedByRole: 'ADMIN', remarks: reason
  });

  res.status(200).json({ success: true, data: document });
});

// @desc    Reject a document
// @route   PATCH /api/admin/doctors/:doctorId/documents/:documentId/reject
// @access  Private (Admin)
exports.rejectDocument = asyncHandler(async (req, res, next) => {
  const { doctorId, documentId } = req.params;
  const { reason } = req.body;

  if (!reason) return next(new ErrorResponse('Reason is required', 400));

  const document = await DoctorDocument.findOne({ _id: documentId, doctor: doctorId });
  if (!document) return next(new ErrorResponse('Document not found', 404));

  document.verificationStatus = 'rejected';
  document.adminRemarks = reason;
  document.rejectedAt = new Date();
  await document.save();

  await DoctorVerificationHistory.create({
    doctor: doctorId, action: 'DOCUMENT_REJECTED', documentId,
    performedBy: req.user.id, performedByRole: 'ADMIN', remarks: reason
  });

  res.status(200).json({ success: true, data: document });
});

// @desc    Update Manual License Verification
// @route   PATCH /api/admin/doctors/:doctorId/license-verification
// @access  Private (Admin)
exports.updateLicenseVerification = asyncHandler(async (req, res, next) => {
  const { doctorId } = req.params;
  const {
    registrationNumberFound,
    registeredNameFound,
    registrationYear,
    medicalCouncil,
    qualificationFound,
    registrationStatus,
    verificationResult,
    remarks,
    verificationSource,
    verificationSourceUrl,
    adminConfirmed
  } = req.body;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  const canVerify = adminConfirmed === true && verificationResult === "matched" && registrationStatus === "active";

  let status = "pending";
  let isLicenseVerified = false;

  if (canVerify) {
    status = "verified";
    isLicenseVerified = true;
  } else if (verificationResult === "not_found") {
    status = "not_found";
  } else if (verificationResult === "mismatch") {
    status = "mismatch";
  } else if (registrationStatus === "suspended") {
    status = "suspended";
  } else if (registrationStatus === "inactive" || registrationStatus === "cancelled") {
    status = "inactive"; // or cancelled based on frontend
  }

  // If not verified, reason is required
  if (!canVerify && !remarks) {
    return next(new ErrorResponse('Remarks/Reason is required for failed verification', 400));
  }

  doctor.licenseVerificationStatus = status;
  doctor.isLicenseVerified = isLicenseVerified;
  doctor.licenseVerifiedBy = req.user.id;
  doctor.licenseVerifiedAt = new Date();
  doctor.licenseVerificationRemarks = remarks;
  doctor.licenseVerificationSource = verificationSource || "NMC Indian Medical Register";
  doctor.licenseVerificationSourceUrl = verificationSourceUrl || "https://www.nmc.org.in/information-desk/indian-medical-register/";
  
  doctor.nmcVerificationDetails = {
    registeredNameFound,
    registrationNumberFound,
    registrationYear,
    medicalCouncil,
    qualificationFound,
    registrationStatus,
    verificationResult
  };

  await doctor.save();

  await DoctorVerificationHistory.create({
    doctor: doctor._id,
    action: `LICENSE_${status.toUpperCase()}`,
    performedBy: req.user.id,
    performedByRole: 'ADMIN',
    remarks: remarks,
    metadata: { source: doctor.licenseVerificationSource, result: verificationResult }
  });

  res.status(200).json({ success: true, data: doctor });
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
      const required = ['IDENTITY_PROOF', 'MEDICAL_LICENSE', 'MEDICAL_DEGREE'];
      const verifiedTypes = docs.filter(d => d.verificationStatus === 'verified' || d.verificationStatus === 'VERIFIED').map(d => d.documentType);
      
      const missing = required.filter(r => !verifiedTypes.includes(r));
      if (missing.length > 0) throw new ErrorResponse(`Cannot approve. Missing verified documents: ${missing.join(', ')}`, 400);
      
      if (doctor.isLicenseVerified !== true || doctor.licenseVerificationStatus !== "verified") {
        throw new ErrorResponse('Medical license verification must be completed before doctor approval.', 400);
      }

      newStatus = 'APPROVED';
      historyAction = 'APPROVED';
      isAcceptingPatients = true;
      doctor.approvalStatus = 'approved';
      doctor.approvedAt = new Date();
      doctor.approvedBy = req.user.id;
      doctor.isVerified = true;
    } else if (action === 'reject') {
      if (!reason) throw new ErrorResponse('Rejection reason is required', 400);
      newStatus = 'REJECTED';
      historyAction = 'REJECTED';
      doctor.approvalStatus = 'rejected';
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
      await notificationService.create({
        userId: doctor.user._id,
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

// @desc    Get all pending doctors
// @route   GET /api/admin/doctors/pending
// @access  Private (Admin)
exports.getPendingDoctors = asyncHandler(async (req, res, next) => {
  const doctors = await Doctor.find({ approvalStatus: "pending" })
    .populate('user', '-password')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: doctors.length, data: doctors });
});

// @desc    Get single doctor by ID
// @route   GET /api/admin/doctors/:doctorId
// @access  Private (Admin)
exports.getDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.doctorId).populate('user', '-password');
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  res.status(200).json({ success: true, data: doctor });
});

// @desc    Approve doctor
// @route   PATCH /api/admin/doctors/:doctorId/approve
// @access  Private (Admin)
exports.approveDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.doctorId,
    {
      approvalStatus: "approved",
      isVerified: true,
      approvedBy: req.user.id,
      approvedAt: new Date(),
      rejectionReason: "",
      isAcceptingPatients: true // Assuming approval allows them to accept patients
    },
    { new: true }
  ).populate('user', '-password');

  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  res.status(200).json({ success: true, data: doctor, message: "Doctor approved successfully." });
});

// @desc    Reject doctor
// @route   PATCH /api/admin/doctors/:doctorId/reject
// @access  Private (Admin)
exports.rejectDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.doctorId,
    {
      approvalStatus: "rejected",
      isVerified: false,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: req.body.rejectionReason || "",
      isAcceptingPatients: false
    },
    { new: true }
  ).populate('user', '-password');

  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  res.status(200).json({ success: true, data: doctor, message: "Doctor registration rejected." });
});
