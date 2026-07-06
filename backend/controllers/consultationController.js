const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const aiService = require('../services/aiService');

// @desc    Save/End Consultation
// @route   POST /api/consultations/end
// @access  Private (doctor)
exports.endConsultation = asyncHandler(async (req, res, next) => {
  const { appointmentId, doctorNotes, diagnosis, duration, simpleExplanation, treatmentAdvice, testsNeeded, followUpDate, emergencySigns } = req.body;

  if (req.user.role !== 'doctor') {
    return next(new ErrorResponse('Only doctors can end consultations', 403));
  }

  const appointment = await Appointment.findById(appointmentId).populate('patient doctor');
  if (!appointment) return next(new ErrorResponse('Appointment not found', 404));

  if (appointment.doctor._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized for this appointment', 403));
  }

  // Generate AI Summary based on doctor notes
  let summary = '';
  if (doctorNotes || diagnosis) {
    const aiResult = await aiService.summarizeConsultation(doctorNotes, diagnosis, appointment.patient);
    summary = aiResult.summary || 'Summary could not be generated.';
  }

  let consultation = await Consultation.findOne({ appointment: appointmentId });
  if (consultation) {
    consultation.doctorNotes = doctorNotes;
    consultation.diagnosis = diagnosis;
    consultation.duration = duration;
    consultation.summary = summary;
    if (simpleExplanation !== undefined) consultation.simpleExplanation = simpleExplanation;
    if (treatmentAdvice !== undefined) consultation.treatmentAdvice = treatmentAdvice;
    if (testsNeeded !== undefined) consultation.testsNeeded = testsNeeded;
    if (followUpDate !== undefined) consultation.followUpDate = followUpDate;
    if (emergencySigns !== undefined) consultation.emergencySigns = emergencySigns;
    await consultation.save();
  } else {
    consultation = await Consultation.create({
      appointment: appointmentId,
      patient: appointment.patient._id,
      doctor: appointment.doctor._id,
      doctorNotes,
      diagnosis,
      duration,
      summary,
      simpleExplanation,
      treatmentAdvice,
      testsNeeded,
      followUpDate,
      emergencySigns
    });
  }

  // Update appointment status to completed
  appointment.status = 'completed';
  appointment.completedAt = new Date();
  await appointment.save();

  res.status(200).json({
    success: true,
    data: consultation
  });
});

// @desc    Get Consultation by Appointment
// @route   GET /api/consultations/appointment/:appointmentId
// @access  Private
exports.getConsultationByAppointment = asyncHandler(async (req, res, next) => {
  const consultation = await Consultation.findOne({ appointment: req.params.appointmentId })
    .populate('patient', 'name email avatar')
    .populate('doctor', 'name email avatar')
    .populate('prescription');

  if (!consultation) return next(new ErrorResponse('Consultation not found', 404));

  res.status(200).json({ success: true, data: consultation });
});
