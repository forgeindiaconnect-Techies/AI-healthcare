const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getPatientMedicalProfile,
  addDiagnosis,
  addLabRecommendation,
  addFollowUp,
  addDoctorNote,
  getPatientReport
} = require('../controllers/medicalController');

const router = express.Router();

// All routes require doctor access
router.use(protect);
router.use(authorize('doctor', 'admin'));

router.get('/patients/:id', getPatientMedicalProfile);
router.post('/diagnosis', addDiagnosis);
router.post('/lab-recommendations', addLabRecommendation);
router.post('/followup', addFollowUp);
router.post('/notes', addDoctorNote);
router.get('/report/:patientId', getPatientReport);

module.exports = router;
