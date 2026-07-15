const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadDoctorDocument } = require('../middleware/uploadMiddleware');

const doctorRouter = express.Router();
const patientRouter = express.Router();
const adminRouter = express.Router();
const reportRouter = express.Router();
const prescriptionRouter = express.Router();
const aiRouter = express.Router();
const notificationRouter = express.Router();

const notificationController = require('../controllers/notificationController');
notificationRouter.use(protect);
notificationRouter.get('/', notificationController.getNotifications);
notificationRouter.put('/read-all', notificationController.markAllAsRead);
notificationRouter.put('/:id/read', notificationController.markAsRead);
notificationRouter.patch('/:id/remove', notificationController.removeNotification);

// ---------------- DOCTOR ROUTES ----------------
const doctorController = require('../controllers/doctorController');
const { approvedDoctorOnly } = require('../middleware/auth');

doctorRouter.get('/', doctorController.getDoctors);
doctorRouter.get('/specializations', doctorController.getSpecializations);
const hospitalDetailsController = require('../controllers/hospitalDetailsController');
doctorRouter.get('/:doctorId/hospital-details', hospitalDetailsController.getDoctorHospitalDetails);
doctorRouter.get('/profile/me', protect, authorize('doctor'), doctorController.getDoctorProfile);
doctorRouter.get('/profile', protect, authorize('doctor'), doctorController.getDoctorProfileData);
doctorRouter.put('/profile', protect, authorize('doctor'), doctorController.updateDoctorProfile);

// New Verification Routes
doctorRouter.get('/verification-status', protect, authorize('doctor'), doctorController.getVerificationStatus);
doctorRouter.post('/documents', protect, authorize('doctor'), uploadDoctorDocument.single('file'), doctorController.uploadDocument);
doctorRouter.post('/submit-verification', protect, authorize('doctor'), doctorController.submitVerification);

doctorRouter.get('/dashboard', protect, approvedDoctorOnly, doctorController.getDoctorDashboard);
doctorRouter.get('/me/appointments', protect, authorize('doctor'), doctorController.getDoctorAppointments);
doctorRouter.get('/me/patients', protect, authorize('doctor'), doctorController.getDoctorPatients);
doctorRouter.get('/patients', protect, approvedDoctorOnly, doctorController.getDoctorPatients); // Keep legacy for backwards compatibility if needed
doctorRouter.post('/:id/rate', protect, authorize('patient'), doctorController.rateDoctor);
// New Availability Routes
const doctorAvailabilityController = require('../controllers/doctorAvailabilityController');
doctorRouter.post('/availability', protect, authorize('doctor'), doctorAvailabilityController.createAvailability);
doctorRouter.get('/availability', protect, authorize('doctor'), doctorAvailabilityController.getAvailability);
doctorRouter.get('/slots/upcoming', protect, authorize('doctor'), doctorAvailabilityController.getUpcomingSlots);
doctorRouter.delete('/availability/:id', protect, authorize('doctor'), doctorAvailabilityController.deleteAvailability);
doctorRouter.patch('/slots/:id/toggle', protect, authorize('doctor'), doctorAvailabilityController.toggleSlot);

const patientBookingController = require('../controllers/patientBookingController');
doctorRouter.get('/:id/available-dates', protect, authorize('patient', 'doctor'), patientBookingController.getAvailableDates);
doctorRouter.get('/:id/slots', protect, authorize('patient', 'doctor'), patientBookingController.getSlotsByDate);

doctorRouter.get('/:id', doctorController.getDoctor);

// ---------------- PATIENT ROUTES ----------------
const patientController = require('../controllers/patientController');
const paymentController = require('../controllers/paymentController');
patientRouter.get('/profile/me', protect, authorize('patient'), patientController.getPatientProfile);
patientRouter.put('/profile', protect, authorize('patient'), patientController.updatePatientProfile);
patientRouter.post('/vitals', protect, authorize('patient', 'doctor'), patientController.addVitals);
patientRouter.get('/vitals/:id', protect, authorize('patient', 'doctor'), patientController.getVitals);
patientRouter.get('/dashboard', protect, authorize('patient'), patientController.getPatientDashboard);
patientRouter.get('/treatment-plans', protect, authorize('patient'), patientController.getPatientTreatmentPlans);
patientRouter.get('/', protect, authorize('admin'), patientController.getAllPatients);

// ---------------- ADMIN ROUTES ----------------
const adminDoctorController = require('../controllers/adminDoctorController');
adminRouter.get('/dashboard', protect, authorize('admin'), patientController.getAdminDashboard);
adminRouter.get('/users', protect, authorize('admin'), patientController.getAllUsers);
adminRouter.put('/users/:id/status', protect, authorize('admin'), patientController.toggleUserStatus);
adminRouter.patch('/users/:id/remove', protect, authorize('admin'), patientController.removeUser);
adminRouter.patch('/users/:id/restore', protect, authorize('admin'), patientController.restoreUser);
adminRouter.get('/logs', protect, authorize('admin'), patientController.getActivityLogs);
adminRouter.get('/archived', protect, authorize('admin'), patientController.getArchivedRecords);
adminRouter.get('/analytics', protect, authorize('admin'), patientController.getAnalytics);

// Admin Doctor Management Routes
adminRouter.post('/doctors', protect, authorize('admin'), adminDoctorController.createDoctor);
adminRouter.get('/doctors', protect, authorize('admin'), adminDoctorController.getAllDoctors);

// New Pending Doctor Approvals Routes
adminRouter.get('/doctors/pending', protect, authorize('admin'), adminDoctorController.getPendingDoctors);
adminRouter.patch('/doctors/:doctorId/approve', protect, authorize('admin'), adminDoctorController.approveDoctor);
adminRouter.patch('/doctors/:doctorId/reject', protect, authorize('admin'), adminDoctorController.rejectDoctor);
adminRouter.get('/doctors/:doctorId', protect, authorize('admin'), adminDoctorController.getDoctor);

// New Review & Verification Routes
adminRouter.get('/doctors/:id/review', protect, authorize('admin'), adminDoctorController.getDoctorForReview);
adminRouter.patch('/doctors/:id/start-review', protect, authorize('admin'), adminDoctorController.startReview);
adminRouter.get('/doctors/:doctorId/documents/:documentId/view', protect, authorize('admin'), adminDoctorController.viewDocument);
adminRouter.patch('/doctors/:doctorId/documents/:documentId/verify', protect, authorize('admin'), adminDoctorController.verifyDocument);
adminRouter.patch('/doctors/:doctorId/documents/:documentId/request-changes', protect, authorize('admin'), adminDoctorController.requestChangesDocument);
adminRouter.patch('/doctors/:doctorId/documents/:documentId/reject', protect, authorize('admin'), adminDoctorController.rejectDocument);
adminRouter.patch('/doctors/:doctorId/license-verification', protect, authorize('admin'), adminDoctorController.updateLicenseVerification);
adminRouter.post('/doctors/:id/:action', protect, authorize('admin'), adminDoctorController.updateDoctorStatus); // approve, reject, suspend, request-changes

adminRouter.put('/doctors/:id', protect, authorize('admin'), adminDoctorController.updateDoctor);
adminRouter.patch('/doctors/:id/remove', protect, authorize('admin'), adminDoctorController.removeDoctor);
adminRouter.patch('/doctors/:id/restore', protect, authorize('admin'), adminDoctorController.restoreDoctor);

// ---------------- REPORT ROUTES ----------------
const reportController = require('../controllers/reportController');
const { uploadReport: uploadReportMiddleware } = require('../config/cloudinary');
reportRouter.use(protect);
reportRouter.get('/', reportController.getReports);
reportRouter.get('/:id', reportController.getReport);
reportRouter.post('/upload', uploadReportMiddleware.single('file'), reportController.uploadReport);
reportRouter.post('/:id/analyze', reportController.analyzeReport);
reportRouter.put('/:id/share', reportController.shareReport);
reportRouter.put('/:id', reportController.updateReport);
reportRouter.patch('/:id/remove', reportController.removeReport);

// ---------------- PRESCRIPTION ROUTES ----------------
const prescriptionController = require('../controllers/prescriptionController');
prescriptionRouter.use(protect);
prescriptionRouter.get('/', prescriptionController.getPrescriptions);
prescriptionRouter.get('/reminders', prescriptionController.getReminders);
prescriptionRouter.get('/:id', prescriptionController.getPrescription);
prescriptionRouter.post('/', authorize('doctor'), prescriptionController.createPrescription);
prescriptionRouter.put('/:id', authorize('doctor'), prescriptionController.updatePrescription);
prescriptionRouter.patch('/:id/void', authorize('doctor', 'admin'), prescriptionController.voidPrescription);

// ---------------- AI ROUTES ----------------
const aiController = require('../controllers/aiController');
aiRouter.post('/chat', protect, aiController.healthChat);
aiRouter.post('/symptom-check', protect, aiController.analyzeSymptoms);
aiRouter.get('/tips', protect, aiController.getHealthTips);
aiRouter.get('/history', protect, aiController.getChatHistory);

const consultationRouter = require('./consultations');
const symptomRouter = require('./symptoms');
const paymentRouter = require('./payments');
const insuranceRouter = require('./insurance');
const dietRouter = require('./diet');

module.exports = {
  doctorRouter,
  patientRouter,
  adminRouter,
  reportRouter,
  prescriptionRouter,
  aiRouter,
  notificationRouter,
  consultationRouter,
  symptomRouter,
  paymentRouter,
  insuranceRouter,
  dietRouter
};
