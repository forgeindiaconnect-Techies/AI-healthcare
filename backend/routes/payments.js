const express = require('express');
const router = express.Router();
const { processPayment, getPaymentHistory, getAllPayments, removePayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/process', protect, processPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/', protect, authorize('admin'), getAllPayments);
router.patch('/:id/archive', protect, authorize('admin'), removePayment);

module.exports = router;
