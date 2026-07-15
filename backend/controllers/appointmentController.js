const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const notificationService = require('../services/notificationService');
const AppointmentSlot = require('../models/AppointmentSlot');
const mongoose = require('mongoose');
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
    // Find appointments that are pending, confirmed, or meeting scheduled
    const activeAppointments = await Appointment.find({
      status: { $in: ['pending', 'confirmed', 'meeting scheduled'] }
    });

    for (let apt of activeAppointments) {
      // Calculate start time
      const dateString = apt.appointmentDate.toISOString().split('T')[0];
      const appointmentStart = new Date(`${dateString}T${apt.appointmentTime}:00`);
      
      // 5 minute grace period
      const expiryTime = new Date(appointmentStart.getTime() + 5 * 60000);

      // If 5 minutes have passed since start time and patient hasn't joined, mark as no-show
      if (now > expiryTime && !apt.patientJoined) {
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
  const { doctor: reqDoctorId, patient: reqPatientId, slotId, reason, type, mode, priority, symptoms, notes, roomNumber } = req.body;

  const doctorId = req.user.role === 'doctor' ? req.user.id : reqDoctorId;
  const patientId = req.user.role === 'doctor' ? reqPatientId : req.user.id;

  if (!doctorId || !patientId || !slotId) return next(new ErrorResponse('Doctor ID, Patient ID, and Slot ID are required', 400));

  const session = await mongoose.startSession();
  let populatedAppointment = null;
  let savedAppointment = null;
  
  try {
    await session.withTransaction(async () => {
      // Find the slot and lock it for this transaction
      const slot = await AppointmentSlot.findOne({ _id: slotId, doctor: doctorId }).session(session);

      if (!slot) {
        throw new ErrorResponse('Slot not found', 404);
      }

      if (slot.status !== 'AVAILABLE') {
        throw new ErrorResponse('This slot was just booked by another patient. Please choose another slot.', 409);
      }

      const doctorProfile = await Doctor.findOne({ user: doctorId }).session(session);
      const patientProfile = await Patient.findOne({ user: patientId }).session(session);

      if (doctorProfile && doctorProfile.status !== 'Approved') {
        throw new ErrorResponse('Doctor is not approved to accept appointments', 403);
      }

      // Mark slot as booked
      slot.status = 'BOOKED';
      
      const queueNumber = mode !== 'video' ? Math.floor(Math.random() * 50) + 1 : undefined;
      const feePaise = doctorProfile?.consultationFeePaise || Math.round((doctorProfile?.consultationFee || 0) * 100);
      const commRate = doctorProfile?.commissionRate || 20;
      const platCommPaise = Math.round(feePaise * commRate / 100);
      const docEarnPaise = feePaise - platCommPaise;

      const appointmentTime = slot.startDateTime.toISOString().split('T')[1].substring(0, 5); // "HH:mm"
      const endTime = slot.endDateTime.toISOString().split('T')[1].substring(0, 5);

      const appointment = new Appointment({
        patient: patientId,
        doctor: doctorId,
        patientProfile: patientProfile?._id,
        doctorProfile: doctorProfile?._id,
        slotId: slot._id,
        appointmentDate: slot.appointmentDate,
        appointmentTime: appointmentTime,
        endTime: endTime,
        reason,
        type: type || 'general',
        mode: mode || 'in-person',
        priority: priority || 'Medium',
        symptoms: symptoms || [],
        notes: { [req.user.role]: notes || '' },
        consultationFee: doctorProfile?.consultationFee || 0,
        consultationFeePaise: feePaise,
        commissionRate: commRate,
        platformCommissionPaise: platCommPaise,
        doctorEarningsPaise: docEarnPaise,
        status: 'Pending Doctor Approval',
        queueNumber,
        roomNumber: roomNumber || (mode !== 'video' ? 'Room 101' : undefined)
      });

      if (appointment.mode === 'video') {
        appointment.meetingLink = `https://meet.jit.si/healthai-${appointment._id}`;
      }

      await appointment.save({ session });
      
      slot.appointmentId = appointment._id;
      await slot.save({ session });

      // Update counters
      if (patientProfile) await Patient.findByIdAndUpdate(patientProfile._id, { $inc: { totalAppointments: 1 } }, { session });
      if (doctorProfile) await Doctor.findByIdAndUpdate(doctorProfile._id, { $inc: { totalAppointments: 1 } }, { session });

      savedAppointment = appointment;
      
      populatedAppointment = await Appointment.findById(appointment._id)
        .populate({ path: 'patient', select: 'name email avatar' })
        .populate({ path: 'doctor', select: 'name email avatar' })
        .session(session);
    });
  } catch (error) {
    session.endSession();
    
    // 11000 is MongoDB's duplicate key error code
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "SLOT_ALREADY_BOOKED",
        message: "This slot was just booked by another patient. Please choose another time."
      });
    }
    
    return next(error);
  }

  session.endSession();

  if (savedAppointment) {
    const doctor = await User.findById(doctorId);
    // Send notifications
    await notificationService.appointmentBooked(req.user, doctor, savedAppointment);

    // Emit socket event to update the booking page for other patients
    const io = req.app.get('io');
    if (io) {
      io.emit('slot_updated', { 
        doctorId: doctorId, 
        slotId: slotId, 
        status: 'BOOKED', 
        date: savedAppointment.appointmentDate 
      });

      io.to(`user_${doctorId.toString()}`).emit('new_notification', {
        title: '🔔 New Appointment Request',
        message: `${populatedAppointment.patient.name} has booked an appointment on ${new Date(savedAppointment.appointmentDate).toDateString()} at ${savedAppointment.appointmentTime}.`,
        type: 'appointment',
        metadata: { appointmentId: savedAppointment._id, status: 'Pending', senderId: req.user.id },
        appointment: populatedAppointment
      });
    }
  }

  res.status(201).json({ success: true, message: 'Appointment booked successfully', data: populatedAppointment });
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

  if (['cancelled', 'Rejected', 'no-show'].includes(status) && updated.slotId) {
    const AppointmentSlot = require('../models/AppointmentSlot');
    await AppointmentSlot.findByIdAndUpdate(updated.slotId, { status: 'AVAILABLE', appointmentId: null });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('slot_updated', { 
        doctorId: appointment.doctor._id, 
        slotId: updated.slotId, 
        status: 'AVAILABLE', 
        date: appointment.appointmentDate 
      });
    }
  }

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
  const { slotId } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new ErrorResponse('Appointment not found', 404));

  if (!slotId) return next(new ErrorResponse('Slot ID is required to reschedule', 400));
  
  const AppointmentSlot = require('../models/AppointmentSlot');
  
  const session = await mongoose.startSession();
  let updatedAppointment = null;
  let oldSlotId = appointment.slotId;

  try {
    await session.withTransaction(async () => {
      const newSlot = await AppointmentSlot.findOne({ _id: slotId, doctor: appointment.doctor }).session(session);
      
      if (!newSlot || newSlot.status !== 'AVAILABLE') {
        throw new ErrorResponse('The selected time slot is not available', 409);
      }

      newSlot.status = 'BOOKED';
      newSlot.appointmentId = appointment._id;
      await newSlot.save({ session });

      if (oldSlotId) {
        await AppointmentSlot.findByIdAndUpdate(oldSlotId, { status: 'AVAILABLE', appointmentId: null }, { session });
      }

      const appointmentTime = newSlot.startDateTime.toISOString().split('T')[1].substring(0, 5); // "HH:mm"
      const endTime = newSlot.endDateTime.toISOString().split('T')[1].substring(0, 5);

      updatedAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { 
          appointmentDate: newSlot.appointmentDate, 
          appointmentTime: appointmentTime,
          endTime: endTime,
          slotId: newSlot._id,
          status: 'rescheduled' 
        },
        { new: true, session }
      );
    });
  } catch (error) {
    session.endSession();
    return next(error);
  }
  
  session.endSession();

  const io = req.app.get('io');
  if (io && oldSlotId) {
    io.emit('slot_updated', { doctorId: appointment.doctor, slotId: oldSlotId, status: 'AVAILABLE' });
    io.emit('slot_updated', { doctorId: appointment.doctor, slotId, status: 'BOOKED' });
  }
  
  if (updatedAppointment) {
    updatedAppointment = await Appointment.findById(updatedAppointment._id).populate('patient doctor', 'name email');
    await notificationService.appointmentStatusChanged(updatedAppointment.patient, updatedAppointment.doctor, updatedAppointment, 'rescheduled', req.user.id);
  }

  res.status(200).json({ success: true, message: 'Appointment rescheduled', data: updatedAppointment });
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
  if (mode) {
    updates.mode = mode;
    if (mode === 'video' && !appointment.meetingLink) {
      updates.meetingLink = `https://meet.jit.si/healthai-${appointment._id}`;
    }
  }
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

// @desc    Cancel/Soft delete an appointment
// @route   PATCH /api/appointments/:id/cancel
// @access  Private (Admin, Doctor, Patient)
exports.cancelAppointment = asyncHandler(async (req, res, next) => {
  const { reason, remarks } = req.body;
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name email')
    .populate('doctor', 'name email');

  if (!appointment) return next(new ErrorResponse('Appointment not found', 404));

  // Authorization check
  const isDoctor = req.user.role === 'doctor' && appointment.doctor._id.toString() === req.user.id;
  const isPatient = req.user.role === 'patient' && appointment.patient._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isDoctor && !isPatient && !isAdmin) {
    return next(new ErrorResponse('Not authorized to cancel this appointment', 403));
  }

  if (appointment.status === 'Completed' || appointment.status === 'completed') {
    return next(new ErrorResponse('Completed appointments cannot be cancelled or removed', 400));
  }

  const previousStatus = appointment.status;
  
  appointment.status = 'Cancelled';
  appointment.isDeleted = true;
  appointment.deletedAt = new Date();
  appointment.deletedBy = req.user.id;
  appointment.deletionReason = reason || 'Not specified';
  appointment.cancellationReason = reason || 'Not specified';
  appointment.cancelledBy = req.user.id;
  appointment.cancelledAt = new Date();

  await appointment.save();

  const AuditLog = require('../models/AuditLog');
  await AuditLog.create({
    action: 'CANCEL_APPOINTMENT',
    resourceType: 'Appointment',
    resourceId: appointment._id,
    previousStatus,
    newStatus: 'Cancelled',
    performedBy: req.user.id,
    performedByRole: req.user.role.toUpperCase(),
    reason: reason || 'Not specified',
    remarks
  });

  // Notification
  await notificationService.appointmentStatusChanged(appointment.patient, appointment.doctor, appointment, 'Cancelled', req.user.id);

  res.status(200).json({ success: true, message: 'Appointment cancelled successfully' });
});

// @desc    Save pre-consultation intake
// @route   PUT /api/appointments/:id/intake
// @access  Private (Patient)
exports.saveIntake = asyncHandler(async (req, res, next) => {
  let appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new ErrorResponse(`Appointment not found with id of ${req.params.id}`, 404));
  }

  if (appointment.patient.toString() !== req.user.id) {
    return next(new ErrorResponse(`Not authorized to update this appointment`, 403));
  }

  appointment.preConsultationIntake = req.body;
  await appointment.save();

  res.status(200).json({
    success: true,
    data: appointment
  });
});
