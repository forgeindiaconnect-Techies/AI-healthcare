const express = require('express');
const router = express.Router();
const { 
  processPayment, 
  getPaymentHistory, 
  getAllPayments, 
  removePayment,
  getPaymentReceipt,
  archiveSelectedPayments,
  archiveFilteredPayments,
  restorePayment
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/process', protect, processPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/', protect, authorize('admin'), getAllPayments);

// Bulk actions (must be before /:id)
router.patch('/archive', protect, authorize('admin'), archiveSelectedPayments);
router.patch('/archive-all', protect, authorize('admin'), archiveFilteredPayments);

// Individual ID actions
router.get('/:id/receipt', protect, authorize('admin', 'patient'), getPaymentReceipt);
router.patch('/:id/archive', protect, authorize('admin'), removePayment);
router.patch('/:id/restore', protect, authorize('admin'), restorePayment);

module.exports = router;
