const express = require('express');
const { protect, authorize } = require('../middleware/auth');

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

// ---------------- DOCTOR ROUTES ----------------
const doctorController = require('../controllers/doctorController');
doctorRouter.get('/', doctorController.getDoctors);
doctorRouter.get('/specializations', doctorController.getSpecializations);
doctorRouter.get('/profile/me', protect, authorize('doctor'), doctorController.getDoctorProfile);
doctorRouter.put('/profile', protect, authorize('doctor'), doctorController.updateDoctorProfile);
doctorRouter.get('/dashboard', protect, authorize('doctor'), doctorController.getDoctorDashboard);
doctorRouter.get('/patients', protect, authorize('doctor'), doctorController.getDoctorPatients);
doctorRouter.post('/:id/rate', protect, authorize('patient'), doctorController.rateDoctor);
doctorRouter.get('/:id', doctorController.getDoctor);

// ---------------- PATIENT ROUTES ----------------
const patientController = require('../controllers/patientController');
patientRouter.get('/profile/me', protect, authorize('patient'), patientController.getPatientProfile);
patientRouter.put('/profile', protect, authorize('patient'), patientController.updatePatientProfile);
patientRouter.post('/vitals', protect, authorize('patient', 'doctor'), patientController.addVitals);
patientRouter.get('/vitals/:id', protect, authorize('patient', 'doctor'), patientController.getVitals);
patientRouter.get('/dashboard', protect, authorize('patient'), patientController.getPatientDashboard);
patientRouter.get('/', protect, authorize('admin', 'doctor'), patientController.getAllPatients);

// ---------------- ADMIN ROUTES ----------------
const adminDoctorController = require('../controllers/adminDoctorController');
adminRouter.get('/dashboard', protect, authorize('admin'), patientController.getAdminDashboard);
adminRouter.get('/users', protect, authorize('admin'), patientController.getAllUsers);
adminRouter.put('/users/:id/status', protect, authorize('admin'), patientController.toggleUserStatus);
adminRouter.delete('/users/:id', protect, authorize('admin'), patientController.deleteUser);
adminRouter.get('/logs', protect, authorize('admin'), patientController.getActivityLogs);
adminRouter.get('/analytics', protect, authorize('admin'), patientController.getAnalytics);

// Admin Doctor Management Routes
adminRouter.post('/doctors', protect, authorize('admin'), adminDoctorController.createDoctor);
adminRouter.get('/doctors', protect, authorize('admin'), adminDoctorController.getAllDoctors);
adminRouter.put('/doctors/:id/approve', protect, authorize('admin'), adminDoctorController.approveDoctor);
adminRouter.put('/doctors/:id', protect, authorize('admin'), adminDoctorController.updateDoctor);
adminRouter.delete('/doctors/:id', protect, authorize('admin'), adminDoctorController.deleteDoctor);

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
reportRouter.delete('/:id', reportController.deleteReport);

// ---------------- PRESCRIPTION ROUTES ----------------
const prescriptionController = require('../controllers/prescriptionController');
prescriptionRouter.use(protect);
prescriptionRouter.get('/', prescriptionController.getPrescriptions);
prescriptionRouter.get('/reminders', prescriptionController.getReminders);
prescriptionRouter.get('/:id', prescriptionController.getPrescription);
prescriptionRouter.post('/', authorize('doctor'), prescriptionController.createPrescription);
prescriptionRouter.put('/:id', authorize('doctor'), prescriptionController.updatePrescription);

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
  insuranceRouter
};
