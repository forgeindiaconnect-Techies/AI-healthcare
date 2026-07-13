const crypto = require('crypto');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Process a new payment
// @route   POST /api/payments/process
// @access  Private
exports.processPayment = asyncHandler(async (req, res, next) => {
  const { amount, currency, method, relatedAppointment, description, paymentData } = req.body;

  // Basic validation
  if (!amount || !method) {
    return next(new ErrorResponse('Amount and payment method are required', 400));
  }

  // Determine what to save based on method
  let paymentDetails = {};
  
  if (method === 'card') {
    if (!paymentData || !paymentData.cardNumber || !paymentData.cvv || !paymentData.expiry) {
      return next(new ErrorResponse('Incomplete card details', 400));
    }
    // We NEVER store CVV. Mask the card number.
    const last4 = paymentData.cardNumber.slice(-4);
    paymentDetails = {
      last4,
      expiry: paymentData.expiry,
      name: paymentData.name || 'Cardholder',
      brand: 'card' // Could deduce visa/mc based on prefix in a real scenario
    };
  } else if (method === 'upi') {
    if (!paymentData || !paymentData.upiId) {
      return next(new ErrorResponse('UPI ID is required', 400));
    }
    paymentDetails = { upiId: paymentData.upiId };
  } else if (method === 'netbanking') {
    if (!paymentData || !paymentData.bank) {
      return next(new ErrorResponse('Bank details required', 400));
    }
    paymentDetails = { bank: paymentData.bank, accountName: paymentData.accountName };
  } else if (method === 'insurance') {
     // Usually an insurance claim is processed via the insurance route,
     // but if they select it as direct payment method:
     paymentDetails = { provider: paymentData.provider || 'Unknown' };
  } else {
    return next(new ErrorResponse('Invalid payment method', 400));
  }

  // Simulate payment processing delay and potential failure
  // In a real app, this is where Stripe/Razorpay API would be called.
  const isSuccessful = Math.random() > 0.05; // 95% success rate for simulation

  if (!isSuccessful) {
    return next(new ErrorResponse('Payment gateway declined the transaction', 402));
  }

  // Generate a mock transaction ID
  const transactionId = 'TXN-' + crypto.randomBytes(8).toString('hex').toUpperCase();

  const payment = await Payment.create({
    patient: req.user.id,
    amount,
    currency: currency || 'USD',
    method,
    status: 'successful',
    transactionId,
    paymentDetails,
    relatedAppointment,
    description
  });

  // If there is an associated appointment, mark it as paid and generate meeting link
  if (relatedAppointment) {
    const { v4: uuidv4 } = require('uuid');
    const apt = await Appointment.findById(relatedAppointment).populate('doctor', 'name');
    
    let meetingLink = undefined;
    if (apt && apt.mode === 'video') {
      meetingLink = `/consultation/${uuidv4()}`;
    }

    await Appointment.findByIdAndUpdate(relatedAppointment, {
      paymentStatus: 'paid',
      paymentMethod: method,
      status: 'Meeting Scheduled',
      meetingLink
    });
    
    // Notify Patient about meeting scheduled
    const io = req.app.get('io');
    if (io && apt) {
      io.to(`user_${apt.patient.toString()}`).emit('new_notification', {
        title: '📅 Meeting Scheduled',
        message: `Payment successful! Your meeting with Dr. ${apt.doctor.name} is scheduled.`,
        type: 'appointment',
        metadata: { appointmentId: apt._id, status: 'Meeting Scheduled' }
      });
    }
  }

  res.status(201).json({
    success: true,
    data: payment
  });
});

// @desc    Get logged in user's payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = asyncHandler(async (req, res, next) => {
  const { includeDeleted } = req.query;
  const query = { patient: req.user.id };
  
  if (includeDeleted !== 'true') {
    query.isDeleted = { $ne: true };
  }

  const payments = await Payment.find(query)
    .sort('-createdAt')
    .populate('relatedAppointment', 'appointmentDate type');

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
});

// @desc    Get all system payments
// @route   GET /api/payments
// @access  Private/Admin
exports.getAllPayments = asyncHandler(async (req, res, next) => {
  const { includeDeleted } = req.query;
  const query = {};
  
  if (includeDeleted !== 'true') {
    query.isDeleted = { $ne: true };
  }

  const payments = await Payment.find(query)
    .populate('patient', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
});

// @desc    Archive (remove) payment
// @route   PATCH /api/payments/:id/archive
// @access  Private (Admin)
exports.removePayment = asyncHandler(async (req, res, next) => {
  const { reason, remarks } = req.body;
  const payment = await Payment.findById(req.params.id);
  
  if (!payment) return next(new ErrorResponse('Payment not found', 404));

  const previousStatus = payment.status;

  payment.status = 'ARCHIVED';
  payment.isDeleted = true;
  payment.deletedAt = new Date();
  payment.deletedBy = req.user.id;
  payment.deletionReason = reason || 'Not specified';
  
  await payment.save();

  const AuditLog = require('../models/AuditLog');
  await AuditLog.create({
    action: 'ARCHIVE_PAYMENT',
    resourceType: 'Payment',
    resourceId: payment._id,
    previousStatus,
    newStatus: 'ARCHIVED',
    performedBy: req.user.id,
    performedByRole: req.user.role.toUpperCase(),
    reason: reason || 'Not specified',
    remarks
  });

  res.status(200).json({ success: true, message: 'Payment archived successfully' });
});
