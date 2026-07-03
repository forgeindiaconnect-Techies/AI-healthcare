const express = require('express');
const router = express.Router();
const { getAppointments, getAppointment, bookAppointment, updateAppointmentStatus, rescheduleAppointment, getAvailableSlots, getTodayAppointments, deleteAppointment, updateAppointment, removeAppointment } = require('../controllers/appointmentController');
const { protect, authorize, logActivity } = require('../middleware/auth');
const { appointmentValidator } = require('../middleware/validator');

router.use(protect);

router.get('/', getAppointments);
router.post('/', authorize('patient', 'doctor'), appointmentValidator, logActivity('BOOK_APPOINTMENT', 'Appointment'), bookAppointment);
router.get('/today', authorize('doctor', 'admin'), getTodayAppointments);
router.get('/slots/:doctorId', getAvailableSlots);
router.get('/:id', getAppointment);
router.put('/:id', logActivity('UPDATE_APPOINTMENT', 'Appointment'), updateAppointment);
router.put('/:id/status', logActivity('UPDATE_APPOINTMENT_STATUS', 'Appointment'), updateAppointmentStatus);
router.put('/:id/reschedule', logActivity('RESCHEDULE_APPOINTMENT', 'Appointment'), rescheduleAppointment);
router.delete('/:id', authorize('admin'), logActivity('DELETE_APPOINTMENT', 'Appointment'), deleteAppointment);
router.patch('/:id/remove', authorize('doctor'), logActivity('REMOVE_APPOINTMENT', 'Appointment'), removeAppointment);

module.exports = router;
