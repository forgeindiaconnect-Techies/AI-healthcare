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
  const prescriptions = await Prescription.find({ patient: patient.user }).sort('-createdAt');
  const notes = await DoctorNote.find({ patient: patient._id }).sort('-createdAt');
  const reports = await MedicalReport.find({ patient: patient.user }).sort('-reportDate');

  res.status(200).json({
    success: true,
    data: {
      patient,
      diagnoses,
      labRecommendations,
      followUps,
      prescriptions,
      notes,
      reports
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
  let patientProfile = await Patient.findOne({ user: req.body.patient }).populate('user');
  if (!patientProfile) return next(new ErrorResponse('Patient profile not found', 404));
  req.body.patient = patientProfile._id;
  req.body.patientName = patientProfile.user.name;
  req.body.patientEmail = patientProfile.user.email;
  
  if (req.body.treatmentAdvice) req.body.description = req.body.treatmentAdvice;

  if (!req.body.confidence) req.body.confidence = 100;
  if (!req.body.riskLevel) req.body.riskLevel = 'Medium';
  
  const diagnosis = await Diagnosis.create(req.body);
  
  res.status(201).json({ success: true, data: diagnosis });
});

// @desc    Update diagnosis
// @route   PUT /api/medical/diagnosis/:id
// @access  Private/Doctor
exports.updateDiagnosis = asyncHandler(async (req, res, next) => {
  let diagnosis = await Diagnosis.findById(req.params.id);

  if (!diagnosis) {
    return next(new ErrorResponse(`Diagnosis not found with id of ${req.params.id}`, 404));
  }

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (diagnosis.doctor.toString() !== doctor._id.toString()) {
    return next(new ErrorResponse(`User not authorized to update this diagnosis`, 401));
  }

  diagnosis = await Diagnosis.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: diagnosis });
});

// @desc    Delete diagnosis
// @route   DELETE /api/medical/diagnosis/:id
// @access  Private/Doctor
exports.deleteDiagnosis = asyncHandler(async (req, res, next) => {
  const diagnosis = await Diagnosis.findById(req.params.id);

  if (!diagnosis) {
    return next(new ErrorResponse(`Diagnosis not found with id of ${req.params.id}`, 404));
  }

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (diagnosis.doctor.toString() !== doctor._id.toString()) {
    return next(new ErrorResponse(`User not authorized to delete this diagnosis`, 401));
  }

  await diagnosis.deleteOne();

  res.status(200).json({ success: true, data: {} });
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
  const { doctorNotes, status } = req.body;
  let report = await MedicalReport.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  report.doctorNotes = doctorNotes;
  if (status) {
    report.status = status;
    if (status === 'reviewed' && !report.reviewedDate) {
      report.reviewedDate = new Date();
    }
  }
  
  await report.save();

  res.status(200).json({
    success: true,
    data: report
  });
});

// @desc    Ask AI about a specific report
// @route   POST /api/medical/reports/:id/chat
// @access  Private/Doctor
exports.askReportAI = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  let report = await MedicalReport.findById(req.params.id).populate('patient', 'name email');

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  const aiService = require('../services/aiService');
  
  const history = report.aiChatHistory || [];
  const response = await aiService.chatAboutReport(report, history, message);

  if (!report.aiChatHistory) {
    report.aiChatHistory = [];
  }
  
  report.aiChatHistory.push({ role: 'user', content: message });
  report.aiChatHistory.push({ role: 'assistant', content: response.content });
  
  await report.save();

  res.status(200).json({
    success: true,
    data: report.aiChatHistory
  });
});

// @desc    Generate final clinical report based on AI and Doctor Notes
// @route   POST /api/medical/reports/:id/final-report
// @access  Private/Doctor
exports.generateFinalReport = asyncHandler(async (req, res, next) => {
  const { notes } = req.body;
  const report = await MedicalReport.findById(req.params.id).populate('patient', 'name email');

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  const aiService = require('../services/aiService');
  
  // Create a structured final clinical report using AI to synthesize findings
  const systemPrompt = `You are an expert Medical AI summarizing a final clinical report. 
Synthesize the original AI Analysis and the Doctor's specific notes into a concise, professional clinical summary.
Include:
1. Patient Overview
2. Key Clinical Findings
3. Doctor's Observations/Notes
4. Final Recommendations/Plan

Format as plain professional text (no markdown formatting if possible).`;

  const input = `AI Analysis: ${report.aiAnalysis?.summary || 'N/A'}\nKey Findings: ${report.aiAnalysis?.keyFindings?.join(', ') || 'N/A'}\nDoctor Notes: ${notes || 'No specific notes provided.'}`;
  
  const response = await aiService.generateFinalClinicalReport(report, notes);
  
  report.doctorNotes = notes;
  report.finalReport = response.content;
  report.status = 'reviewed';
  report.reviewedDate = new Date();
  
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

// @desc    Update patient details
// @route   PUT /api/medical/patients/:id
// @access  Private/Doctor
exports.updatePatientProfile = asyncHandler(async (req, res, next) => {
  const { age, gender, bloodType, height, weight, allergies, chronicConditions, emergencyContact } = req.body;
  
  let patient = await Patient.findById(req.params.id);
  if (!patient) {
    patient = await Patient.findOne({ user: req.params.id });
  }
  if (!patient) {
    return next(new ErrorResponse('Patient not found', 404));
  }

  // Update User fields if provided (for age/gender)
  if (age || gender) {
    const User = require('../models/User');
    const user = await User.findById(patient.user);
    if (user) {
      if (gender) user.gender = gender;
      if (age && !user.dateOfBirth) {
        const currentYear = new Date().getFullYear();
        user.dateOfBirth = new Date(`${currentYear - age}-01-01`);
      }
      await user.save();
    }
  }

  // Update Patient fields
  if (bloodType !== undefined) patient.bloodType = bloodType;
  if (height !== undefined) patient.height = height;
  if (weight !== undefined) patient.weight = weight;
  if (allergies) patient.allergies = Array.isArray(allergies) ? allergies : allergies.split(',').map(s => s.trim());
  if (chronicConditions) patient.chronicConditions = Array.isArray(chronicConditions) ? chronicConditions : chronicConditions.split(',').map(s => s.trim());
  if (emergencyContact) patient.emergencyContact = emergencyContact;

  await patient.save();

  res.status(200).json({ success: true, data: patient });
});

// @desc    Add vitals to patient
// @route   POST /api/medical/patients/:id/vitals
// @access  Private/Doctor
exports.addVitals = asyncHandler(async (req, res, next) => {
  let patient = await Patient.findById(req.params.id);
  if (!patient) patient = await Patient.findOne({ user: req.params.id });
  if (!patient) return next(new ErrorResponse('Patient not found', 404));

  const vitalsEntry = {
    ...req.body,
    recordedBy: req.user._id,
    date: new Date()
  };

  patient.vitals.push(vitalsEntry);
  patient.vitals.sort((a, b) => b.date - a.date);
  await patient.save();

  res.status(200).json({ success: true, data: patient.vitals });
});

// @desc    Patient Level AI Chat
// @route   POST /api/medical/patients/:id/ai-chat
// @access  Private/Doctor
exports.patientAIChat = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  let patient = await Patient.findById(req.params.id).populate('user', 'name');
  if (!patient) patient = await Patient.findOne({ user: req.params.id }).populate('user', 'name');
  if (!patient) return next(new ErrorResponse('Patient not found', 404));

  const diagnoses = await Diagnosis.find({ patient: patient._id }).sort('-createdAt').limit(5);
  const history = patient.aiDiagnosisChatHistory || [];
  
  const aiService = require('../services/aiService');
  const reportContext = {
    patient: patient.user,
    title: 'General Patient Profile',
    reportType: 'Profile',
    aiAnalysis: {
      summary: `Patient has ${diagnoses.length} recent diagnoses.`,
      keyFindings: diagnoses.map(d => `${d.primaryDiagnosis} (Confidence: ${d.confidence}%)`)
    }
  };

  const response = await aiService.chatAboutReport(reportContext, history, message);

  if (!patient.aiDiagnosisChatHistory) {
    patient.aiDiagnosisChatHistory = [];
  }
  
  patient.aiDiagnosisChatHistory.push({ role: 'user', content: message });
  patient.aiDiagnosisChatHistory.push({ role: 'assistant', content: response.content });
  
  await patient.save();

  res.status(200).json({ success: true, data: patient.aiDiagnosisChatHistory });
});

// @desc    Update lifestyle recommendations
// @route   PUT /api/medical/patients/:id/lifestyle
// @access  Private/Doctor
exports.updateLifestyle = asyncHandler(async (req, res, next) => {
  let patient = await Patient.findById(req.params.id);
  if (!patient) patient = await Patient.findOne({ user: req.params.id });
  if (!patient) return next(new ErrorResponse('Patient not found', 404));

  patient.lifestyle = { ...patient.lifestyle, ...req.body };
  await patient.save();

  res.status(200).json({ success: true, data: patient.lifestyle });
});

// @desc    Add prescription
// @route   POST /api/medical/prescriptions
// @access  Private/Doctor
exports.addPrescription = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  
  let patient = await Patient.findById(req.body.patient);
  if (!patient) patient = await Patient.findOne({ user: req.body.patient });
  if (!patient) return next(new ErrorResponse('Patient not found', 404));

  const prescription = await Prescription.create({
    patient: patient.user,
    doctor: req.user._id,
    diagnosis: req.body.diagnosis || 'General',
    medicines: req.body.medications || req.body.medicines,
    instructions: req.body.instructions
  });

  res.status(201).json({ success: true, data: prescription });
});

// @desc    Update prescription
// @route   PUT /api/medical/prescriptions/:id
// @access  Private/Doctor
exports.editPrescription = asyncHandler(async (req, res, next) => {
  const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: prescription });
});

// @desc    Delete prescription
// @route   DELETE /api/medical/prescriptions/:id
// @access  Private/Doctor
exports.deletePrescription = asyncHandler(async (req, res, next) => {
  await Prescription.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, data: {} });
});

// @desc    Update doctor note
// @route   PUT /api/medical/notes/:id
// @access  Private/Doctor
exports.editDoctorNote = asyncHandler(async (req, res, next) => {
  const note = await DoctorNote.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: note });
});

// @desc    Delete doctor note
// @route   DELETE /api/medical/notes/:id
// @access  Private/Doctor
exports.deleteDoctorNote = asyncHandler(async (req, res, next) => {
  await DoctorNote.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, data: {} });
});

// @desc    Delete medical report
// @route   DELETE /api/medical/reports/:id
// @access  Private/Doctor
exports.deleteReport = asyncHandler(async (req, res, next) => {
  const report = await MedicalReport.findById(req.params.id);
  
  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  await report.deleteOne();

  res.status(200).json({ success: true, data: {} });
});
