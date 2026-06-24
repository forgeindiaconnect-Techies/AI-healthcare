const Symptom = require('../models/Symptom');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all symptoms
// @route   GET /api/symptoms
// @access  Private
exports.getAllSymptoms = asyncHandler(async (req, res, next) => {
  const symptoms = await Symptom.find({ isActive: true }).sort('name');
  
  res.status(200).json({
    success: true,
    count: symptoms.length,
    data: symptoms
  });
});

// @desc    Get single symptom
// @route   GET /api/symptoms/:id
// @access  Private
exports.getSymptom = asyncHandler(async (req, res, next) => {
  const symptom = await Symptom.findById(req.params.id);

  if (!symptom) {
    return next(new ErrorResponse(`Symptom not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: symptom
  });
});

// @desc    Create new symptom
// @route   POST /api/symptoms
// @access  Private (Admin)
exports.createSymptom = asyncHandler(async (req, res, next) => {
  const symptom = await Symptom.create(req.body);

  res.status(201).json({
    success: true,
    data: symptom
  });
});

// @desc    Update symptom
// @route   PUT /api/symptoms/:id
// @access  Private (Admin)
exports.updateSymptom = asyncHandler(async (req, res, next) => {
  let symptom = await Symptom.findById(req.params.id);

  if (!symptom) {
    return next(new ErrorResponse(`Symptom not found with id of ${req.params.id}`, 404));
  }

  symptom = await Symptom.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: symptom
  });
});

// @desc    Delete symptom
// @route   DELETE /api/symptoms/:id
// @access  Private (Admin)
exports.deleteSymptom = asyncHandler(async (req, res, next) => {
  const symptom = await Symptom.findById(req.params.id);

  if (!symptom) {
    return next(new ErrorResponse(`Symptom not found with id of ${req.params.id}`, 404));
  }

  await symptom.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
