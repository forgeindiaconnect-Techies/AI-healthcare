const { body, param, query, validationResult } = require('express-validator');

// Check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Auth validators
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must have uppercase, lowercase and number'),
  body('role').optional().isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role'),
  validate,
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// Appointment validators
const appointmentValidator = [
  body('doctor').isMongoId().withMessage('Valid doctor ID required'),
  body('appointmentDate').optional().isISO8601().withMessage('Valid date required'),
  body('appointmentTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid time required (HH:MM)'),
  body('reason').trim().notEmpty().withMessage('Reason for visit is required'),
  body('type')
    .optional()
    .isIn(['general', 'follow-up', 'specialist', 'emergency', 'online', 'checkup']),
  validate,
];

// Prescription validators
const prescriptionValidator = [
  body('patient').isMongoId().withMessage('Valid patient ID required'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine required'),
  body('medicines.*.name').trim().notEmpty().withMessage('Medicine name required'),
  body('medicines.*.dosage').trim().notEmpty().withMessage('Dosage required'),
  body('medicines.*.frequency').trim().notEmpty().withMessage('Frequency required'),
  body('medicines.*.duration').trim().notEmpty().withMessage('Duration required'),
  validate,
];

// Password reset validators
const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  validate,
];

const resetPasswordValidator = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must have uppercase, lowercase and number'),
  validate,
];

// Vitals validator
const vitalsValidator = [
  body('bloodPressure.systolic').optional().isInt({ min: 60, max: 250 }),
  body('bloodPressure.diastolic').optional().isInt({ min: 40, max: 150 }),
  body('heartRate').optional().isInt({ min: 30, max: 250 }),
  body('temperature').optional().isFloat({ min: 35, max: 45 }),
  body('oxygenSaturation').optional().isFloat({ min: 50, max: 100 }),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  appointmentValidator,
  prescriptionValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  vitalsValidator,
};
