const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const notificationService = require('../services/notificationService');
const { v4: uuidv4 } = require('uuid');

// Helper: check appointment slot availability
const isSlotAvailable = async (doctorId, date, time, excludeId = null) => {
  const query = {
    doctor: doctorId,
    appointmentDate: {
      $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
      $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
    },
    appointmentTime: time,
    status: { $nin: ['cancelled', 'no-show'] },
  };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Appointment.findOne(query);
  return !existing;
};

// Helper: auto-update expired appointments to no-show
const autoUpdateNoShows = async () => {
  try {
    const now = new Date();
    // Find appointments that are pending or confirmed
    const activeAppointments = await Appointment.find({
      status: { $in: ['pending', 'confirmed'] }
    });

    for (let apt of activeAppointments) {
      // Calculate end time
      const dateString = apt.appointmentDate.toISOString().split('T')[0];
      const appointmentStart = new Date(`${dateString}T${apt.appointmentTime}:00`);
      
      const duration = apt.duration || 30;
      const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000);

      // If end time has passed and patient hasn't joined, mark as no-show
      if (now > appointmentEnd && !apt.patientJoined) {
        apt.status = 'no-show';
        await apt.save();
      }
    }
  } catch (error) {
    console.error('Error auto-updating no-shows:', error);
  }
};

// @desc    Get appointments (role-based)
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = asyncHandler(async (req, res) => {
  await autoUpdateNoShows();

  const { page = 1, limit = 100, status, startDate, endDate, type } = req.query;
  const query = { isDeleted: { $ne: true } };

  // Role-based filtering
  if (req.user.role === 'patient') query.patient = req.user.id;
  else if (req.user.role === 'doctor') query.doctor = req.user.id;

  if (status) query.status = status;
  if (type) query.type = type;
  if (startDate || endDate) {
    query.appointmentDate = {};
    if (startDate) query.appointmentDate.$gte = new Date(startDate);
    if (endDate) query.appointmentDate.$lte = new Date(endDate);
  }

  const total = await Appointment.countDocuments(query);
  const appointments = await Appointment.find(query)
    .populate('patient', 'name email avatar phone')
    .populate('doctor', 'name email avatar phone')
    .populate('prescription')
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    count: appointments.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: appointments,
  });
});

// @desc    Get today's appointments for doctor
// @route   GET /api/appointments/today
// @access  Private/Doctor
exports.getTodayAppointments = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Appointment.find({
    doctor: req.user.id,
    appointmentDate: {
      $gte: today,
      $lt: tomorrow
    },
    isDeleted: { $ne: true }
  })
    .populate('patient', 'name email avatar phone dateOfBirth gender')
    .sort({ appointmentTime: 1 });

  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments,
  });
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name email avatar phone dateOfBirth gender')
    .populate('doctor', 'name email avatar phone')
    .populate('patientProfile')
    .populate('doctorProfile')
    .populate('prescription');

  if (!appointment) return next(new ErrorResponse('Appointment not found', 404));

  // Access control
  if (
    req.user.role === 'patient' && appointment.patient._id.toString() !== req.user.id ||
    req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user.id
  ) {
    if (req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to view this appointment', 403));
    }
  }

  res.status(200).json({ success: true, data: appointment });
});

// @desc    Book appointment
// @route   POST /api/appointments
// @access  Private (patient, doctor)
exports.bookAppointment = asyncHandler(async (req, res, next) => {
  const { doctor: reqDoctorId, patient: reqPatientId, appointmentDate, appointmentTime, reason, type, mode, priority, symptoms, notes, roomNumber } = req.body;

  const doctorId = req.user.role === 'doctor' ? req.user.id : reqDoctorId;
  const patientId = req.user.role === 'doctor' ? reqPatientId : req.user.id;

  if (!doctorId || !patientId) return next(new ErrorResponse('Doctor and Patient IDs are required', 400));

  // Verify doctor exists
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
  if (!doctor) return next(new ErrorResponse('Doctor not found', 404));

  // Verify patient exists
  const patientUser = await User.findOne({ _id: patientId, role: 'patient', isActive: true });
  if (!patientUser) return next(new ErrorResponse('Patient not found', 404));

  const doctorProfile = await Doctor.findOne({ user: doctorId });
  const patientProfile = await Patient.findOne({ user: patientId });

  // Check availability
  const available = await isSlotAvailable(doctorId, appointmentDate, appointmentTime);
  if (!available) {
    return next(new ErrorResponse('This time slot is already booked. Please choose another time.', 409));
  }

  const queueNumber = mode !== 'video' ? Math.floor(Math.random() * 50) + 1 : undefined;

  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    patientProfile: patientProfile?._id,
    doctorProfile: doctorProfile?._id,
    appointmentDate: new Date(appointmentDate),
    appointmentTime,
    reason,
    type: type || 'general',
    mode: mode || 'in-person',
    priority: priority || 'Medium',
    symptoms: symptoms || [],
    notes: { [req.user.role]: notes || '' },
    consultationFee: doctorProfile?.consultationFee || 0,
    status: 'Pending Doctor Approval',
    queueNumber,
    roomNumber: roomNumber || (mode !== 'video' ? 'Room 101' : undefined)
  });

  // Update counters
  if (patientProfile) await Patient.findByIdAndUpdate(patientProfile._id, { $inc: { totalAppointments: 1 } });
  if (doctorProfile) await Doctor.findByIdAndUpdate(doctorProfile._id, { $inc: { totalAppointments: 1 } });

  // Send notifications
  await notificationService.appointmentBooked(req.user, doctor, appointment);

  const populated = await appointment.populate([
    { path: 'patient', select: 'name email avatar' },
    { path: 'doctor', select: 'name email avatar' },
  ]);

  // Emit socket event to the doctor
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${doctor._id.toString()}`).emit('new_notification', {
      title: '🔔 New Appointment Request',
      message: `${populated.patient.name} has booked an appointment on ${new Date(appointment.appointmentDate).toDateString()} at ${appointment.appointmentTime}.`,
      type: 'appointment',
      metadata: { appointmentId: appointment._id, status: 'Pending', senderId: req.user.id },
      appointment: populated
    });
  }

  res.status(201).json({ success: true, message: 'Appointment booked successfully', data: populated });
});

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = asyncHandler(async (req, res, next) => {
  const { status, notes, cancellationReason, followUpDate } = req.body;
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name email preferences')
    .populate('doctor', 'name email');

  if (!appointment) return next(new ErrorResponse('Appointment not found', 404));

  // Authorization
  const isDoctor = req.user.role === 'doctor' && appointment.doctor._id.toString() === req.user.id;
  const isPatient = req.user.role === 'patient' && appointment.patient._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isDoctor && !isPatient && !isAdmin) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // Patients can only cancel
  if (isPatient && status !== 'cancelled') {
    return next(new ErrorResponse('Patients can only cancel appointments', 403));
  }

  const updates = { status };
  if (notes) updates[`notes.${req.user.role}`] = notes;
  if (cancellationReason && status === 'cancelled') {
    updates.cancellationReason = cancellationReason;
    updates.cancelledBy = req.user.id;
    updates.cancelledAt = new Date();
  }
  if (status === 'confirmed') updates.confirmedAt = new Date();
  if (status === 'completed') {
    updates.completedAt = new Date();
    if (followUpDate) {
      updates.followUpDate = followUpDate;
      updates.followUpRequired = true;
    }
  }

  const updated = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('patient', 'name email')
    .populate('doctor', 'name email');

  // Notification
  await notificationService.appointmentStatusChanged(appointment.patient, appointment.doctor, appointment, status, req.user.id);

  // Emit socket event to the patient
  const io = req.app.get('io');
  if (io) {
    let title = `Appointment Status Updated`;
    let message = `Your appointment with Dr. ${appointment.doctor.name} is now: ${status}.`;
    
    if (status === 'Approved - Payment Pending') {
      title = '✅ Appointment Approved';
      message = `Dr. ${appointment.doctor.name} has approved your appointment. Please complete the payment to schedule the meeting.`;
    } else if (status === 'Rejected') {
      title = '❌ Appointment Rejected';
      message = `Your appointment request has been rejected by Dr. ${appointment.doctor.name}. Please select another available time or doctor.`;
    } else if (status === 'Meeting Scheduled') {
      title = '📅 Meeting Scheduled';
      message = `Payment successful! Your meeting with Dr. ${appointment.doctor.name} is scheduled.`;
    }

    io.to(`user_${appointment.patient._id.toString()}`).emit('new_notification', {
      title,
      message,
      type: 'appointment',
      metadata: { appointmentId: appointment._id, status, senderId: req.user.id },
      appointment: updated
    });
  }

  res.status(200).json({ success: true, message: `Appointment ${status}`, data: updated });
});

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private
exports.rescheduleAppointment = asyncHandler(async (req, res, next) => {
  const { appointmentDate, appointmentTime } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new ErrorResponse('Appointment not found', 404));

  const available = await isSlotAvailable(appointment.doctor, appointmentDate, appointmentTime, req.params.id);
  if (!available) return next(new ErrorResponse('This time slot is not available', 409));

  const updated = await Appointment.findByIdAndUpdate(
    req.params.id,
    { appointmentDate: new Date(appointmentDate), appointmentTime, status: 'rescheduled' },
    { new: true }
  ).populate('patient doctor', 'name email');

  res.status(200).json({ success: true, message: 'Appointment rescheduled', data: updated });
});

// @desc    Generic update for appointment details (Doctor/Admin)
// @route   PUT /api/appointments/:id
// @access  Private (Doctor, Admin)
exports.updateAppointment = asyncHandler(async (req, res, next) => {
  const { appointmentDate, appointmentTime, mode, priority, reason, notes } = req.body;
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name email')
    .populate('doctor', 'name email');
  
  if (!appointment) return next(new ErrorResponse('Appointment not found', 404));

  // Authorization check (must be assigned doctor or admin)
  if (req.user.role !== 'admin' && (req.user.role !== 'doctor' || appointment.doctor._id.toString() !== req.user.id)) {
    return next(new ErrorResponse('Not authorized to update this appointment', 403));
  }

  const updates = {};
  if (appointmentDate) updates.appointmentDate = new Date(appointmentDate);
  if (appointmentTime) updates.appointmentTime = appointmentTime;
  if (mode) updates.mode = mode;
  if (priority) updates.priority = priority;
  if (reason) updates.reason = reason;
  if (notes) {
    updates.notes = { ...appointment.notes, [req.user.role]: notes };
  }

  const updated = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('patient', 'name email avatar')
    .populate('doctor', 'name email avatar');

  // Trigger notification if date/time changed
  if (appointmentDate || appointmentTime) {
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${appointment.patient._id.toString()}`).emit('new_notification', {
        title: '📅 Appointment Updated',
        message: `Your follow-up appointment with Dr. ${appointment.doctor.name} has been updated.`,
        type: 'appointment',
        metadata: { appointmentId: appointment._id },
        appointment: updated
      });
    }
  }

  res.status(200).json({ success: true, message: 'Appointment updated successfully', data: updated });
});

// @desc    Get available slots for a doctor
// @route   GET /api/appointments/slots/:doctorId
// @access  Private
exports.getAvailableSlots = asyncHandler(async (req, res, next) => {
  const { date } = req.query;
  if (!date) return next(new ErrorResponse('Date is required', 400));

  const doctorProfile = await Doctor.findOne({ user: req.params.doctorId });
  if (!doctorProfile) return next(new ErrorResponse('Doctor not found', 404));

  const dayOfWeek = new Date(date).getDay();
  const dayAvailability = doctorProfile.availability?.find((a) => a.dayOfWeek === dayOfWeek);

  if (!dayAvailability || !dayAvailability.isAvailable) {
    return res.status(200).json({ success: true, data: { slots: [], message: 'Doctor not available on this day' } });
  }

  // Generate time slots
  const slots = [];
  const [startH, startM] = dayAvailability.startTime.split(':').map(Number);
  const [endH, endM] = dayAvailability.endTime.split(':').map(Number);
  let currentH = startH, currentM = startM;
  const duration = doctorProfile.consultationDuration || 30;

  while (currentH < endH || (currentH === endH && currentM < endM)) {
    const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
    slots.push(timeStr);
    currentM += duration;
    if (currentM >= 60) { currentH += Math.floor(currentM / 60); currentM = currentM % 60; }
  }

  // Get booked slots
  const booked = await Appointment.find({
    doctor: req.params.doctorId,
    appointmentDate: {
      $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
      $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
    },
    status: { $nin: ['cancelled', 'no-show'] },
    isDeleted: { $ne: true }
  }).select('appointmentTime');

  const bookedTimes = booked.map((a) => a.appointmentTime);
  const availableSlots = slots.map((slot) => ({ time: slot, available: !bookedTimes.includes(slot) }));

  res.status(200).json({ success: true, data: { slots: availableSlots, date } });
});

// @desc    Get today's appointments for doctor
// @route   GET /api/appointments/today
// @access  Private (doctor)
exports.getTodayAppointments = asyncHandler(async (req, res) => {
  await autoUpdateNoShows();

  const today = new Date();
  const appointments = await Appointment.find({
    doctor: req.user.id,
    appointmentDate: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lt: new Date(today.setHours(23, 59, 59, 999)),
    },
    status: { $ne: 'cancelled' },
  })
    .populate('patient', 'name email avatar phone')
    .populate('patientProfile', 'bloodType allergies chronicConditions')
    .sort({ appointmentTime: 1 });

  res.status(200).json({ success: true, count: appointments.length, data: appointments });
});

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (admin)
exports.deleteAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new ErrorResponse('Appointment not found', 404));
  await appointment.deleteOne();
  res.status(200).json({ success: true, message: 'Appointment deleted' });
});

// @desc    Soft delete (remove) an appointment (Doctor only)
// @route   PATCH /api/appointments/:id/remove
// @access  Private/Doctor
exports.removeAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new ErrorResponse('Appointment not found', 404));
  }

  // Ensure user is doctor and owns the appointment
  if (req.user.role !== 'doctor') {
    return next(new ErrorResponse('Not authorized to remove appointments', 403));
  }

  if (appointment.doctor.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to remove this appointment', 403));
  }

  appointment.isDeleted = true;
  appointment.deletedAt = new Date();
  appointment.deletedBy = req.user.id;
  
  await appointment.save();

  res.status(200).json({
    success: true,
    message: 'Appointment removed successfully'
  });
});
