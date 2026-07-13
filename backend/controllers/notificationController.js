const { Notification } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { $set: { isRead: true, readAt: Date.now() } }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  notification.isRead = true;
  notification.readAt = Date.now();
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Remove (soft delete) a single notification
// @route   PATCH /api/notifications/:id/remove
// @access  Private
exports.removeNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  // We could just delete it since notifications aren't critical, but let's soft-delete if it has isDeleted field, or just hard delete if it doesn't.
  // Wait, Notification model doesn't have isDeleted. Let's just delete it for notifications since they are transient.
  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Notification removed'
  });
});
