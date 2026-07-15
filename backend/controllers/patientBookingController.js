const AppointmentSlot = require('../models/AppointmentSlot');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// @desc    Get dates with available slots for a doctor
// @route   GET /api/doctors/:id/available-dates
// @access  Private
exports.getAvailableDates = asyncHandler(async (req, res, next) => {
  const doctorId = req.params.id;

  // Find all available slots for this doctor from today onwards
  const slots = await AppointmentSlot.find({
    doctor: doctorId,
    status: 'AVAILABLE',
    startDateTime: { $gte: new Date() }
  }).select('appointmentDate').lean();

  // Extract unique dates as YYYY-MM-DD
  const datesSet = new Set();
  slots.forEach(slot => {
    datesSet.add(slot.appointmentDate.toISOString().split('T')[0]);
  });

  const availableDates = Array.from(datesSet).sort();

  res.status(200).json({
    success: true,
    data: availableDates
  });
});

// @desc    Get slots for a specific doctor and date
// @route   GET /api/doctors/:id/slots
// @access  Private
exports.getSlotsByDate = asyncHandler(async (req, res, next) => {
  const doctorId = req.params.id;
  const { date } = req.query; // format YYYY-MM-DD

  if (!date) {
    return next(new ErrorResponse('Date parameter is required', 400));
  }

  // Create start and end of day in UTC to match how dates are stored
  const startDate = new Date(`${date}T00:00:00.000Z`);
  const endDate = new Date(`${date}T23:59:59.999Z`);

  const slots = await AppointmentSlot.find({
    doctor: doctorId,
    appointmentDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort('startDateTime');

  res.status(200).json({
    success: true,
    data: slots
  });
});
