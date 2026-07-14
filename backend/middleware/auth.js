const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ActivityLog } = require('../models/index');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Protect routes - verify JWT
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ErrorResponse('User not found', 401));
    }

    if (!user.isActive) {
      return next(new ErrorResponse('Your account has been suspended. Contact admin.', 401));
    }

    if (user.isLocked) {
      return next(new ErrorResponse('Account is temporarily locked due to multiple failed login attempts', 423));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ErrorResponse('Session expired. Please log in again.', 401));
    }
    return next(new ErrorResponse('Invalid token', 401));
  }
});

// Role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

const Doctor = require('../models/Doctor');
exports.approvedDoctorOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return next(new ErrorResponse('Not authorized', 403));
  }
  
  const doctor = await Doctor.findOne({ user: req.user.id });

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor account not found."
    });
  }

  const hasDashboardAccess =
    doctor.approvalStatus === "approved" &&
    doctor.isVerified === true &&
    doctor.isLicenseVerified === true &&
    doctor.licenseVerificationStatus === "verified";

  if (!hasDashboardAccess) {
    return res.status(403).json({
      success: false,
      code: "DOCTOR_ACCESS_NOT_APPROVED",
      message: "Admin approval and valid license verification are required."
    });
  }

  req.doctor = doctor;
  next();
});

// Optional auth - doesn't fail if no token
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (err) {
      // Silent fail - route continues without user
    }
  }
  next();
});

// Log activity
exports.logActivity = (action, resource) => {
  return asyncHandler(async (req, res, next) => {
    res.on('finish', async () => {
      try {
        await ActivityLog.create({
          user: req.user?._id,
          action,
          resource,
          resourceId: req.params?.id,
          details: `${req.method} ${req.originalUrl}`,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          method: req.method,
          statusCode: res.statusCode,
          isSuccess: res.statusCode < 400,
        });
      } catch (err) {
        // Non-blocking log failure
      }
    });
    next();
  });
};
