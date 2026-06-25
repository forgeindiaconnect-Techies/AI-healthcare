const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getPatientMedicalProfile,
  addDiagnosis,
  getAllDiagnoses,
  addLabRecommendation,
  getAllLabRecommendations,
  addFollowUp,
  getAllFollowUps,
  addDoctorNote,
  getPatientReport
} = require('../controllers/medicalController');

const router = express.Router();

// All routes require doctor access
router.use(protect);
router.use(authorize('doctor', 'admin'));

router.get('/patients/:id', getPatientMedicalProfile);

router.route('/diagnosis')
  .post(addDiagnosis)
  .get(getAllDiagnoses);

router.route('/lab-recommendations')
  .post(addLabRecommendation)
  .get(getAllLabRecommendations);

router.route('/followup')
  .post(addFollowUp)
  .get(getAllFollowUps);

router.post('/notes', addDoctorNote);
router.get('/report/:patientId', getPatientReport);

module.exports = router;
