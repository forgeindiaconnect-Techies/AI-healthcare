const Message = require('../models/Message');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get chat history between two users (or by appointment)
// @route   GET /api/chat/:userId
// @access  Private
exports.getChatHistory = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { appointmentId } = req.query;

  let query = {
    $or: [
      { sender: req.user.id, receiver: userId },
      { sender: userId, receiver: req.user.id }
    ]
  };

  if (appointmentId) {
    query.appointment = appointmentId;
  }

  const messages = await Message.find(query)
    .populate('sender', 'name avatar')
    .sort('createdAt');

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Send a text message
// @route   POST /api/chat
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { receiver, appointment, text } = req.body;

  if (!receiver || !text) {
    return next(new ErrorResponse('Receiver and text are required', 400));
  }

  const message = await Message.create({
    sender: req.user.id,
    receiver,
    appointment,
    text
  });

  const populated = await message.populate('sender', 'name avatar');

  res.status(201).json({
    success: true,
    data: populated
  });
});

// @desc    Mark messages as read
// @route   PUT /api/chat/:userId/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const { userId } = req.params; // The user who sent the messages

  await Message.updateMany(
    { sender: userId, receiver: req.user.id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.status(200).json({
    success: true,
    message: 'Messages marked as read'
  });
});

// @desc    Upload file for chat
// @route   POST /api/chat/upload
// @access  Private
exports.uploadChatFile = asyncHandler(async (req, res, next) => {
  // Assuming a generic upload middleware is used that puts the file in req.body.fileUrl
  // For simplicity, we'll just accept a fileUrl from the frontend if they use Cloudinary directly,
  // or a multipart upload if implemented.
  const { fileUrl, fileType, receiver, appointment } = req.body;

  if (!fileUrl || !receiver) {
    return next(new ErrorResponse('File URL and receiver are required', 400));
  }

  const message = await Message.create({
    sender: req.user.id,
    receiver,
    appointment,
    fileUrl,
    fileType: fileType || 'document',
    text: 'Sent a file'
  });

  const populated = await message.populate('sender', 'name avatar');

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${receiver}`).emit('chat_message', populated);
  }

  res.status(201).json({
    success: true,
    data: populated
  });
});
