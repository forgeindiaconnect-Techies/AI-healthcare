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
  getPatientReport,
  saveConsultation,
  getAllReportsForDoctor,
  reviewReport,
  createTreatmentPlan,
  getTreatmentPlans
} = require('../controllers/medicalController');

const router = express.Router();

// All routes require doctor access
router.use(protect);
router.use(authorize('doctor', 'admin'));

router.post('/consultation', saveConsultation);
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

// Reports Review
router.route('/reports')
  .get(getAllReportsForDoctor);
router.route('/reports/:id/review')
  .put(reviewReport);

// Treatment Plans
router.route('/treatment-plans')
  .post(createTreatmentPlan)
  .get(getTreatmentPlans);

module.exports = router;
