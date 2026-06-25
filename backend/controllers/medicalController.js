const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const LabRecommendation = require('../models/LabRecommendation');
const FollowUp = require('../models/FollowUp');
const Prescription = require('../models/Prescription');
const DoctorNote = require('../models/DoctorNote');
const Doctor = require('../models/Doctor');

// @desc    Get complete patient profile for doctor
// @route   GET /api/medical/patients/:id
// @access  Private/Doctor
exports.getPatientMedicalProfile = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id).populate('user', 'name email dateOfBirth gender avatar phone');
  if (!patient) {
    return next(new ErrorResponse('Patient not found', 404));
  }

  // Get historical medical data
  const diagnoses = await Diagnosis.find({ patient: patient._id }).sort('-createdAt');
  const labRecommendations = await LabRecommendation.find({ patient: patient._id }).sort('-createdAt');
  const followUps = await FollowUp.find({ patient: patient._id }).sort('-createdAt');
  const prescriptions = await Prescription.find({ patient: patient._id }).sort('-createdAt');
  const notes = await DoctorNote.find({ patient: patient._id }).sort('-createdAt');

  res.status(200).json({
    success: true,
    data: {
      patient,
      diagnoses,
      labRecommendations,
      followUps,
      prescriptions,
      notes
    }
  });
});

// @desc    Add diagnosis
// @route   POST /api/medical/diagnosis
// @access  Private/Doctor
exports.addDiagnosis = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  req.body.doctor = doctor._id;
  
  const diagnosis = await Diagnosis.create(req.body);
  
  res.status(201).json({ success: true, data: diagnosis });
});

// @desc    Add lab recommendation
// @route   POST /api/medical/lab-recommendations
// @access  Private/Doctor
exports.addLabRecommendation = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  req.body.doctor = doctor._id;
  
  const labReq = await LabRecommendation.create(req.body);
  
  res.status(201).json({ success: true, data: labReq });
});

// @desc    Add followup
// @route   POST /api/medical/followup
// @access  Private/Doctor
exports.addFollowUp = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  req.body.doctor = doctor._id;
  
  const followup = await FollowUp.create(req.body);
  
  res.status(201).json({ success: true, data: followup });
});

// @desc    Add doctor note
// @route   POST /api/medical/notes
// @access  Private/Doctor
exports.addDoctorNote = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  req.body.doctor = doctor._id;
  
  const note = await DoctorNote.create(req.body);
  
  res.status(201).json({ success: true, data: note });
});

// @desc    Get aggregated report for a patient
// @route   GET /api/medical/report/:patientId
// @access  Private/Doctor
exports.getPatientReport = asyncHandler(async (req, res, next) => {
  // Can be expanded to format specifically for PDF generation
  const patient = await Patient.findById(req.params.patientId).populate('user', 'name email dateOfBirth gender');
  const diagnoses = await Diagnosis.find({ patient: req.params.patientId }).sort('-createdAt').limit(5);
  const labs = await LabRecommendation.find({ patient: req.params.patientId }).sort('-createdAt').limit(10);
  const meds = await Prescription.find({ patient: req.params.patientId }).sort('-createdAt').limit(10);
  const note = await DoctorNote.findOne({ patient: req.params.patientId }).sort('-createdAt');
  
  res.status(200).json({
    success: true,
    data: { patient, diagnoses, labs, meds, latestNote: note }
  });
});
