const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const notificationService = require('../services/notificationService');

// @desc    Create a new doctor (Admin)
// @route   POST /api/admin/doctors
// @access  Private (Admin)
exports.createDoctor = asyncHandler(async (req, res, next) => {
  const { 
    name, email, phone, password, gender, dateOfBirth, address,
    specialization, qualification, experience, registrationNumber, 
    hospitalName, consultationFee, status // Default 'Pending' or 'Active' based on admin choice
  } = req.body;

  // Check if user exists
  let user = await User.findOne({ email });
  if (user) {
    return next(new ErrorResponse('User with this email already exists', 400));
  }

  // Check if license number exists
  let existingDoctor = await Doctor.findOne({ licenseNumber: registrationNumber });
  if (existingDoctor) {
    return next(new ErrorResponse('Doctor with this Medical Registration Number already exists', 400));
  }

  // Create base User
  user = await User.create({
    name,
    email,
    password, // Hash will be handled by pre-save hook in User model
    role: 'doctor',
    phone,
    gender,
    dateOfBirth,
    address,
    isActive: true, // The user account is active, but doctor profile might not be verified
    isEmailVerified: true // Auto verify since admin created it
  });

  // Determine verification status
  const isVerified = status === 'Active';

  try {
    // Create Doctor Profile
    const doctor = await Doctor.create({
      user: user._id,
      specialization,
      licenseNumber: registrationNumber, // using licenseNumber field from model
      experience: experience || 0,
      education: qualification ? [{ degree: qualification }] : [],
      hospital: { name: hospitalName },
      consultationFee: consultationFee || 0,
      isVerified,
      isAcceptingPatients: isVerified
    });

    // Notify Doctor (Simulation since real email depends on env vars)
    await notificationService.createNotification({
      user: user._id,
      title: 'Doctor Account Created',
      message: 'Your doctor account has been successfully created by the administrator. You can now login.',
      type: 'system',
      priority: 'high'
    });

    res.status(201).json({
      success: true,
      data: { user, profile: doctor }
    });
  } catch (error) {
    // Rollback: delete the created user if doctor profile creation fails
    await User.findByIdAndDelete(user._id);
    return next(new ErrorResponse('Failed to create doctor profile: ' + error.message, 400));
  }
});

// @desc    Get all doctors for Admin (including unverified)
// @route   GET /api/admin/doctors
// @access  Private (Admin)
exports.getAllDoctors = asyncHandler(async (req, res, next) => {
  const { search, isVerified } = req.query;
  
  let profileQuery = {};
  if (isVerified !== undefined) {
    profileQuery.isVerified = isVerified === 'true';
  }

  if (search) {
    const users = await User.find({
      role: 'doctor',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    const userIds = users.map(u => u._id);
    profileQuery.user = { $in: userIds };
  }

  const doctors = await Doctor.find(profileQuery)
    .populate('user', '-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: doctors.length,
    data: doctors
  });
});

// @desc    Approve or Reject doctor
// @route   PUT /api/admin/doctors/:id/approve
// @access  Private (Admin)
exports.approveDoctor = asyncHandler(async (req, res, next) => {
  const { approve } = req.body; // true or false
  
  const doctor = await Doctor.findById(req.params.id).populate('user');
  if (!doctor) {
    return next(new ErrorResponse('Doctor not found', 404));
  }

  if (approve) {
    doctor.isVerified = true;
    doctor.isAcceptingPatients = true;
    await doctor.save();

    await notificationService.createNotification({
      user: doctor.user._id,
      title: 'Account Approved',
      message: 'Your account has been approved by the administrator. You can now accept patients.',
      type: 'system',
      priority: 'high'
    });

    res.status(200).json({ success: true, message: 'Doctor approved', data: doctor });
  } else {
    // If reject, we could set isVerified false, or delete the account. Let's just set isVerified = false for now.
    doctor.isVerified = false;
    doctor.isAcceptingPatients = false;
    await doctor.save();

    await notificationService.createNotification({
      user: doctor.user._id,
      title: 'Account Rejected',
      message: 'Your account approval has been rejected by the administrator.',
      type: 'system',
      priority: 'high'
    });

    res.status(200).json({ success: true, message: 'Doctor rejected', data: doctor });
  }
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

  // Update User
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (gender) user.gender = gender;
  if (address) user.address = address;
  await user.save();

  // Update Doctor Profile
  if (specialization) doctor.specialization = specialization;
  if (registrationNumber) doctor.licenseNumber = registrationNumber;
  if (experience !== undefined) doctor.experience = experience;
  if (qualification) {
    // Basic array update, assuming admin only enters 1 string for simplification
    doctor.education = [{ degree: qualification }];
  }
  if (hospitalName) {
    doctor.hospital = { ...doctor.hospital, name: hospitalName };
  }
  if (consultationFee !== undefined) doctor.consultationFee = consultationFee;

  await doctor.save();

  res.status(200).json({ success: true, data: { user, profile: doctor } });
});

// @desc    Delete doctor (Admin)
// @route   DELETE /api/admin/doctors/:id
// @access  Private (Admin)
exports.deleteDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  // Delete associated user
  await User.findByIdAndDelete(doctor.user);
  
  // Optionally delete appointments (omitted to keep history if needed, or handle it here)
  await Appointment.deleteMany({ doctor: doctor.user });

  await doctor.deleteOne();

  res.status(200).json({ success: true, message: 'Doctor and associated data deleted' });
});
