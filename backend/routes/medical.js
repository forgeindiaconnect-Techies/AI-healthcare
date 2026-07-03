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
  askReportAI,
  createTreatmentPlan,
  getTreatmentPlans,
  getMyDiagnoses,
  updatePatientProfile,
  addVitals,
  patientAIChat,
  updateLifestyle,
  addPrescription,
  editPrescription,
  deletePrescription,
  editDoctorNote,
  deleteDoctorNote,
  generateFinalReport
} = require('../controllers/medicalController');

const router = express.Router();

// Patient routes
router.route('/my-diagnoses')
  .get(protect, authorize('patient'), getMyDiagnoses);

// All other routes require doctor access
router.use(protect);
router.use(authorize('doctor', 'admin'));

router.post('/consultation', saveConsultation);
router.route('/patients/:id')
  .get(getPatientMedicalProfile)
  .put(updatePatientProfile);

router.post('/patients/:id/vitals', addVitals);
router.post('/patients/:id/ai-chat', patientAIChat);
router.put('/patients/:id/lifestyle', updateLifestyle);

router.route('/diagnosis')
  .post(addDiagnosis)
  .get(getAllDiagnoses);

router.route('/lab-recommendations')
  .post(addLabRecommendation)
  .get(getAllLabRecommendations);

router.route('/followup')
  .post(addFollowUp)
  .get(getAllFollowUps);

router.route('/notes')
  .post(addDoctorNote);
router.route('/notes/:id')
  .put(editDoctorNote)
  .delete(deleteDoctorNote);

router.route('/prescriptions')
  .post(addPrescription);
router.route('/prescriptions/:id')
  .put(editPrescription)
  .delete(deletePrescription);

router.get('/report/:patientId', getPatientReport);

// Reports Review
router.route('/reports')
  .get(getAllReportsForDoctor);
router.route('/reports/:id/review')
  .put(reviewReport);
router.post('/reports/:id/chat', askReportAI);
router.post('/reports/:id/final-report', generateFinalReport);

// Treatment Plans
router.route('/treatment-plans')
  .post(createTreatmentPlan)
  .get(getTreatmentPlans);

module.exports = router;
