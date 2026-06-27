const express = require('express');
const router = express.Router();
const {
  getAllSymptoms,
  getSymptom,
  createSymptom,
  updateSymptom,
  deleteSymptom,
  analyzeSymptom
} = require('../controllers/symptomController');

const { protect, authorize } = require('../middleware/auth');

router.post('/analyze', protect, analyzeSymptom);

router.route('/')
  .get(protect, getAllSymptoms)
  .post(protect, authorize('admin'), createSymptom);

router.route('/:id')
  .get(protect, getSymptom)
  .put(protect, authorize('admin'), updateSymptom)
  .delete(protect, authorize('admin'), deleteSymptom);

module.exports = router;
