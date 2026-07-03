const express = require('express');
const {
  getDiseases,
  getDietPlans,
  createDietReport,
  getPatientDietReports,
  analyzeDietPlan
} = require('../controllers/dietController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All diet routes require authentication

router.get('/diseases', getDiseases);
router.get('/plans/:diseaseId', getDietPlans);
router.post('/reports', createDietReport);
router.get('/reports/:patientId', getPatientDietReports);
router.post('/analyze', analyzeDietPlan);

module.exports = router;
