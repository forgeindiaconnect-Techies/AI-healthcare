const express = require('express');
const router = express.Router();
const { getAppointments, getAppointment, bookAppointment, updateAppointmentStatus, rescheduleAppointment, getAvailableSlots, getTodayAppointments, cancelAppointment, updateAppointment, saveIntake } = require('../controllers/appointmentController');
const { protect, authorize, logActivity } = require('../middleware/auth');
const { appointmentValidator } = require('../middleware/validator');

router.use(protect);

router.get('/', getAppointments);
router.post('/', authorize('patient', 'doctor'), appointmentValidator, logActivity('BOOK_APPOINTMENT', 'Appointment'), bookAppointment);
router.get('/today', authorize('doctor', 'admin'), getTodayAppointments);
router.get('/slots/:doctorId', getAvailableSlots);
router.get('/:id', getAppointment);
router.put('/:id', logActivity('UPDATE_APPOINTMENT', 'Appointment'), updateAppointment);
router.put('/:id/intake', authorize('patient'), logActivity('UPDATE_APPOINTMENT_INTAKE', 'Appointment'), saveIntake);
router.put('/:id/status', logActivity('UPDATE_APPOINTMENT_STATUS', 'Appointment'), updateAppointmentStatus);
router.put('/:id/reschedule', logActivity('RESCHEDULE_APPOINTMENT', 'Appointment'), rescheduleAppointment);
router.patch('/:id/cancel', authorize('admin', 'doctor', 'patient'), logActivity('CANCEL_APPOINTMENT', 'Appointment'), cancelAppointment);

module.exports = router;
