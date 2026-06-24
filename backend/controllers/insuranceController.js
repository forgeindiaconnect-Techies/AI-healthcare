const InsuranceClaim = require('../models/InsuranceClaim');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Submit a new insurance claim
// @route   POST /api/insurance/claims
// @access  Private
exports.submitClaim = asyncHandler(async (req, res, next) => {
  // In a real app, you might upload documents to cloudinary here
  // and store the URLs. For this implementation, we assume URLs are provided.
  
  const claim = await InsuranceClaim.create({
    ...req.body,
    patient: req.user.id
  });

  res.status(201).json({
    success: true,
    data: claim
  });
});

// @desc    Get logged in user's claims
// @route   GET /api/insurance/claims/me
// @access  Private
exports.getMyClaims = asyncHandler(async (req, res, next) => {
  const claims = await InsuranceClaim.find({ patient: req.user.id })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: claims.length,
    data: claims
  });
});

// @desc    Get all insurance claims (Admin)
// @route   GET /api/insurance/claims
// @access  Private/Admin
exports.getAllClaims = asyncHandler(async (req, res, next) => {
  const claims = await InsuranceClaim.find()
    .populate('patient', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: claims.length,
    data: claims
  });
});

// @desc    Update claim status (Admin)
// @route   PUT /api/insurance/claims/:id/status
// @access  Private/Admin
exports.updateClaimStatus = asyncHandler(async (req, res, next) => {
  const { status, adminNotes } = req.body;
  
  if (!status) {
    return next(new ErrorResponse('Please provide a status', 400));
  }

  const claim = await InsuranceClaim.findByIdAndUpdate(
    req.params.id,
    { status, adminNotes },
    { new: true, runValidators: true }
  );

  if (!claim) {
    return next(new ErrorResponse(`Claim not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: claim
  });
});
