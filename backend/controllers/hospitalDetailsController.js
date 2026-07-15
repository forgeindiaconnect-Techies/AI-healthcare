const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const DoctorHospitalDetails = require('../models/DoctorHospitalDetails');
const Doctor = require('../models/Doctor');

// @desc    Get hospital details for a doctor (public/patient)
// @route   GET /api/doctors/:doctorId/hospital-details
// @access  Public or Private
exports.getDoctorHospitalDetails = asyncHandler(async (req, res, next) => {
  const { doctorId } = req.params;

  // Verify doctor exists
  const doctor = await Doctor.findOne({ user: doctorId });
  if (!doctor) {
    return next(new ErrorResponse('Doctor not found', 404));
  }

  const hospitalDetails = await DoctorHospitalDetails.find({ 
    doctor: doctor._id,
    isActive: true 
  });

  res.status(200).json({
    success: true,
    data: hospitalDetails
  });
});

// @desc    Get logged in doctor's hospital details
// @route   GET /api/doctor/hospital-details
// @access  Private (Doctor)
exports.getMyHospitalDetails = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) {
    return next(new ErrorResponse('Doctor profile not found', 404));
  }

  const hospitalDetails = await DoctorHospitalDetails.find({ doctor: doctor._id });

  res.status(200).json({
    success: true,
    data: hospitalDetails
  });
});

// @desc    Add a hospital location for logged in doctor
// @route   POST /api/doctor/hospital-details
// @access  Private (Doctor)
exports.addHospitalDetails = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) {
    return next(new ErrorResponse('Doctor profile not found', 404));
  }

  const data = {
    ...req.body,
    doctor: doctor._id
  };

  const hospitalDetails = await DoctorHospitalDetails.create(data);

  res.status(201).json({
    success: true,
    data: hospitalDetails
  });
});

// @desc    Update a hospital location
// @route   PUT /api/doctor/hospital-details/:id
// @access  Private (Doctor)
exports.updateHospitalDetails = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) {
    return next(new ErrorResponse('Doctor profile not found', 404));
  }

  let hospitalDetails = await DoctorHospitalDetails.findById(req.params.id);

  if (!hospitalDetails) {
    return next(new ErrorResponse('Hospital location not found', 404));
  }

  if (hospitalDetails.doctor.toString() !== doctor._id.toString()) {
    return next(new ErrorResponse('Not authorized to update this location', 403));
  }

  hospitalDetails = await DoctorHospitalDetails.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: hospitalDetails
  });
});

// @desc    Delete a hospital location
// @route   DELETE /api/doctor/hospital-details/:id
// @access  Private (Doctor)
exports.deleteHospitalDetails = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) {
    return next(new ErrorResponse('Doctor profile not found', 404));
  }

  const hospitalDetails = await DoctorHospitalDetails.findById(req.params.id);

  if (!hospitalDetails) {
    return next(new ErrorResponse('Hospital location not found', 404));
  }

  if (hospitalDetails.doctor.toString() !== doctor._id.toString()) {
    return next(new ErrorResponse('Not authorized to delete this location', 403));
  }

  await hospitalDetails.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
