const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const LabRecommendation = require('../models/LabRecommendation');
const FollowUp = require('../models/FollowUp');
const Prescription = require('../models/Prescription');
const DoctorNote = require('../models/DoctorNote');
const Doctor = require('../models/Doctor');
const Report = require('../models/Report');
const MedicalReport = require('../models/MedicalReport');
const TreatmentPlan = require('../models/TreatmentPlan');

// @desc    Get complete patient profile for doctor
// @route   GET /api/medical/patients/:id
// @access  Private/Doctor
exports.getPatientMedicalProfile = asyncHandler(async (req, res, next) => {
  let patient = await Patient.findById(req.params.id).populate('user', 'name email dateOfBirth gender avatar phone');
  
  if (!patient) {
    // If not found by Patient ID, try searching by User ID
    patient = await Patient.findOne({ user: req.params.id }).populate('user', 'name email dateOfBirth gender avatar phone');
  }

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
  if (!doctor) return next(new ErrorResponse('Doctor profile not found', 404));
  req.body.doctor = doctor._id;

  // The frontend sends user ID for patient, so we need to find the Patient profile
  let patientProfile = await Patient.findOne({ user: req.body.patient });
  if (!patientProfile) return next(new ErrorResponse('Patient profile not found', 404));
  req.body.patient = patientProfile._id;

  if (!req.body.confidence) req.body.confidence = 100;
  if (!req.body.riskLevel) req.body.riskLevel = 'Medium';
  
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

// @desc    Get all diagnoses for a doctor
// @route   GET /api/medical/diagnosis
// @access  Private/Doctor
exports.getAllDiagnoses = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) return next(new ErrorResponse('Doctor profile not found', 404));

  const diagnoses = await Diagnosis.find({ doctor: doctor._id })
    .populate({
      path: 'patient',
      populate: { path: 'user', select: 'name email avatar' }
    })
    .sort('-createdAt');
  
  res.status(200).json({ success: true, count: diagnoses.length, data: diagnoses });
});

// @desc    Get all diagnoses for a patient (logged in)
// @route   GET /api/medical/my-diagnoses
// @access  Private/Patient
exports.getMyDiagnoses = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) return next(new ErrorResponse('Patient profile not found', 404));

  const diagnoses = await Diagnosis.find({ patient: patient._id })
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name email avatar' }
    })
    .sort('-createdAt');
  
  res.status(200).json({ success: true, count: diagnoses.length, data: diagnoses });
});

// @desc    Get all lab recommendations for a doctor
// @route   GET /api/medical/lab-recommendations
// @access  Private/Doctor
exports.getAllLabRecommendations = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const labs = await LabRecommendation.find({ doctor: doctor._id })
    .populate({
      path: 'patient',
      populate: { path: 'user', select: 'name email' }
    })
    .sort('-createdAt');
  
  res.status(200).json({ success: true, count: labs.length, data: labs });
});

// @desc    Get all follow ups for a doctor
// @route   GET /api/medical/followup
// @access  Private/Doctor
exports.getAllFollowUps = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const followups = await FollowUp.find({ doctor: doctor._id })
    .populate({
      path: 'patient',
      populate: { path: 'user', select: 'name email phone' }
    })
    .sort('timeline');
  
  res.status(200).json({ success: true, count: followups.length, data: followups });
});

// @desc    Save complete consultation workflow
// @route   POST /api/medical/consultation
// @access  Private/Doctor
exports.saveConsultation = asyncHandler(async (req, res, next) => {
  const { appointmentId, patientId, symptoms, vitals, diagnosis, prescriptions, labRecommendations, followUp, notes } = req.body;
  const doctor = await Doctor.findOne({ user: req.user._id });

  if (!doctor) {
    return next(new ErrorResponse('Doctor profile not found', 404));
  }

  // 1. Save Diagnosis
  if (diagnosis && diagnosis.primaryDiagnosis) {
    await Diagnosis.create({
      patient: patientId,
      doctor: doctor._id,
      ...diagnosis
    });
  }

  // 2. Save Lab Recommendations
  if (labRecommendations && labRecommendations.length > 0) {
    const labDocs = labRecommendations.map(lab => ({
      patient: patientId,
      doctor: doctor._id,
      ...lab
    }));
    await LabRecommendation.insertMany(labDocs);
  }

  // 3. Save Prescriptions
  if (prescriptions && prescriptions.length > 0) {
    await Prescription.create({
      patient: patientId,
      doctor: doctor._id,
      appointment: appointmentId,
      medications: prescriptions,
      instructions: notes
    });
  }

  // 4. Save Follow-up
  if (followUp && followUp.timeline) {
    await FollowUp.create({
      patient: patientId,
      doctor: doctor._id,
      ...followUp
    });
  }

  // 5. Save Doctor Notes (Symptoms & Vitals)
  await DoctorNote.create({
    patient: patientId,
    doctor: doctor._id,
    note: `Chief Complaint/Symptoms: ${symptoms.complaint}\nDuration: ${symptoms.duration}\nNotes: ${notes}`,
  });

  // 6. Update Appointment Status
  const Appointment = require('../models/Appointment');
  const appointment = await Appointment.findById(appointmentId);
  if (appointment) {
    appointment.status = 'completed';
    await appointment.save();
  }

  res.status(201).json({ success: true, message: 'Consultation saved successfully' });
});

// @desc    Get all reports for doctor
// @route   GET /api/medical/reports
// @access  Private/Doctor
exports.getAllReportsForDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) return next(new ErrorResponse('Doctor profile not found', 404));

  const reports = await MedicalReport.find() // Should ideally be filtered by patients assigned to the doctor, but for demo we will fetch all or mock
    .populate('patient', 'name email avatar')
    .sort('-reportDate');

  res.status(200).json({
    success: true,
    data: reports
  });
});

// @desc    Review a report
// @route   PUT /api/medical/reports/:id/review
// @access  Private/Doctor
exports.reviewReport = asyncHandler(async (req, res, next) => {
  const { doctorNotes } = req.body;
  let report = await MedicalReport.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  report.status = 'reviewed';
  report.doctorNotes = doctorNotes;
  await report.save();

  res.status(200).json({
    success: true,
    data: report
  });
});

// @desc    Create treatment plan
// @route   POST /api/medical/treatment-plans
// @access  Private/Doctor
exports.createTreatmentPlan = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) return next(new ErrorResponse('Doctor profile not found', 404));

  const { patientId, title, description, startDate, endDate, goals, instructions } = req.body;

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }
  if (!patient) {
    return next(new ErrorResponse('Patient profile not found', 404));
  }

  const plan = await TreatmentPlan.create({
    patient: patient._id,
    doctor: doctor._id,
    title,
    description,
    startDate,
    endDate,
    goals,
    instructions,
    status: 'Active'
  });

  res.status(201).json({
    success: true,
    data: plan
  });
});

// @desc    Get treatment plans for doctor
// @route   GET /api/medical/treatment-plans
// @access  Private/Doctor
exports.getTreatmentPlans = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) return next(new ErrorResponse('Doctor profile not found', 404));

  const plans = await TreatmentPlan.find({ doctor: doctor._id })
    .populate({
      path: 'patient',
      populate: { path: 'user', select: 'name email avatar' }
    })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: plans
  });
});
