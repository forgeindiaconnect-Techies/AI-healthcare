const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyHospitalDetails,
  addHospitalDetails,
  updateHospitalDetails,
  deleteHospitalDetails
} = require('../controllers/hospitalDetailsController');

// All these routes are for the doctor dashboard
router.use(protect);
router.use(authorize('doctor'));

router.route('/')
  .get(getMyHospitalDetails)
  .post(addHospitalDetails);

router.route('/:id')
  .put(updateHospitalDetails)
  .delete(deleteHospitalDetails);

module.exports = router;
