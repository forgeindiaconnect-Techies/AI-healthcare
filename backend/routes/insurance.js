const express = require('express');
const router = express.Router();
const { submitClaim, getMyClaims, getAllClaims, updateClaimStatus } = require('../controllers/insuranceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/claims', protect, submitClaim);
router.get('/claims/me', protect, getMyClaims);
router.get('/claims', protect, authorize('admin'), getAllClaims);
router.put('/claims/:id/status', protect, authorize('admin'), updateClaimStatus);

module.exports = router;
