const express = require('express');
const router = express.Router();
const { processPayment, getPaymentHistory, getAllPayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/process', protect, processPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/', protect, authorize('admin'), getAllPayments);

module.exports = router;
