const crypto = require('crypto');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// Send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();
  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    token,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      preferences: user.preferences,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const {
    name, email, password, role = 'patient', phone,
    specialization, licenseNumber, qualification, experience,
    hospitalName, facilityType, consultationFee,
    docLicenseUrl, docDegreeUrl, docIdUrl, docClinicUrl
  } = req.body;

  let location = req.body.location;
  if (typeof location === 'string') {
    try { location = JSON.parse(location); } catch(e) { /* keep as string if not JSON */ }
  }

  let availability = req.body.availability;
  if (typeof availability === 'string') {
    try { availability = JSON.parse(availability); } catch(e) { }
  }

  let parsedDocuments = [];
  if (req.body.documents) {
    if (typeof req.body.documents === 'string') {
      try { parsedDocuments = JSON.parse(req.body.documents); } catch(e) {}
    } else {
      parsedDocuments = req.body.documents;
    }
  }

  if (req.files) {
    const { docLicenseFile, docDegreeFile, docIdFile, docClinicFile } = req.files;
    
    if (docLicenseFile?.[0]) parsedDocuments.push({ title: 'Medical License', fileUrl: docLicenseFile[0].path || `/uploads/${docLicenseFile[0].filename}`, fileType: 'file' });
    else if (docLicenseUrl) parsedDocuments.push({ title: 'Medical License', fileUrl: docLicenseUrl, fileType: 'url' });
    
    if (docDegreeFile?.[0]) parsedDocuments.push({ title: 'Degree Certificate', fileUrl: docDegreeFile[0].path || `/uploads/${docDegreeFile[0].filename}`, fileType: 'file' });
    else if (docDegreeUrl) parsedDocuments.push({ title: 'Degree Certificate', fileUrl: docDegreeUrl, fileType: 'url' });
    
    if (docIdFile?.[0]) parsedDocuments.push({ title: 'Government ID', fileUrl: docIdFile[0].path || `/uploads/${docIdFile[0].filename}`, fileType: 'file' });
    else if (docIdUrl) parsedDocuments.push({ title: 'Government ID', fileUrl: docIdUrl, fileType: 'url' });
    
    if (docClinicFile?.[0]) parsedDocuments.push({ title: 'Clinic Registration Proof', fileUrl: docClinicFile[0].path || `/uploads/${docClinicFile[0].filename}`, fileType: 'file' });
    else if (docClinicUrl) parsedDocuments.push({ title: 'Clinic Registration Proof', fileUrl: docClinicUrl, fileType: 'url' });
  } else if (parsedDocuments.length === 0) {
    if (docLicenseUrl) parsedDocuments.push({ title: 'Medical License', fileUrl: docLicenseUrl, fileType: 'url' });
    if (docDegreeUrl) parsedDocuments.push({ title: 'Degree Certificate', fileUrl: docDegreeUrl, fileType: 'url' });
    if (docIdUrl) parsedDocuments.push({ title: 'Government ID', fileUrl: docIdUrl, fileType: 'url' });
    if (docClinicUrl) parsedDocuments.push({ title: 'Clinic Registration Proof', fileUrl: docClinicUrl, fileType: 'url' });
  }

  // Check existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 409));
  }

  // Handle location/address string to object mapping
  const addressObj = typeof location === 'string' ? { city: location } : (location || undefined);

  // Create user
  let user;
  try {
    user = await User.create({ name, email, password, role, phone, address: addressObj });
  } catch (error) {
    return next(error);
  }

  // Create role-specific profile
  try {
    if (role === 'patient') {
      await Patient.create({ user: user._id });
    } else if (role === 'doctor') {
      if (!specialization || !licenseNumber) {
        await User.findByIdAndDelete(user._id);
        return next(new ErrorResponse('Doctors require specialization and license number', 400));
      }
      await Doctor.create({
        user: user._id,
        specialization,
        licenseNumber,
        experience: experience || 0,
        education: qualification ? [{ degree: qualification }] : [],
        hospital: { name: hospitalName || '' },
        facilityType: facilityType || 'Clinic',
        clinicAddress: addressObj || {},
        consultationFee: consultationFee || 0,
        availability: availability || [],
        documents: parsedDocuments,
        status: 'Pending',
        isVerified: false
      });
    }
  } catch (error) {
    if (user && user._id) {
      await User.findByIdAndDelete(user._id);
    }
    return next(error);
  }

  // Send welcome email (non-blocking)
  try {
    await emailService.sendWelcome(user);
  } catch (emailErr) {
    logger.warn(`Welcome email failed: ${emailErr.message}`);
  }

  // Generate email verification token
  const verifyToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendEmailVerification(user, verifyToken);
  } catch (emailErr) {
    logger.warn(`Verification email failed: ${emailErr.message}`);
  }

  logger.info(`New user registered: ${email} (${role})`);
  
  if (role === 'doctor') {
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for admin approval before logging in.'
    });
  }

  sendTokenResponse(user, 201, res, 'Registration successful. Please verify your email.');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (user.isLocked) {
    return next(new ErrorResponse('Account locked. Try again in 2 hours or reset your password.', 423));
  }

  if (!user.isActive) {
    return next(new ErrorResponse('Account suspended. Contact admin.', 403));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: user._id });
    if (doctor && (!doctor.isVerified || doctor.status !== 'Approved')) {
      return next(new ErrorResponse(`Account is ${doctor.status.toLowerCase()}. Please wait for admin approval.`, 403));
    }
  }

  // Reset login attempts on success
  if (user.loginAttempts > 0) {
    await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`);
  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  let profile = null;

  if (user.role === 'patient') {
    profile = await Patient.findOne({ user: user._id })
      .populate('preferredDoctor', 'name email')
      .lean();
  } else if (user.role === 'doctor') {
    profile = await Doctor.findOne({ user: user._id }).lean();
  }

  res.status(200).json({ success: true, data: { user, profile } });
});

// @desc    Update profile
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'phone', 'dateOfBirth', 'gender', 'address', 'preferences'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: 'Profile updated', data: user });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// @desc    Upload avatar
// @route   PUT /api/auth/avatar
// @access  Private
exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: req.file.path, avatarPublicId: req.file.filename },
    { new: true }
  );

  res.status(200).json({ success: true, message: 'Avatar uploaded', data: { avatar: user.avatar } });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // Don't reveal if email exists
    return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordReset(user, resetToken);
    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful');
});

// @desc    Verify email
// @route   GET /api/auth/verifyemail/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const emailVerificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired verification token', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Email verified successfully' });
});
