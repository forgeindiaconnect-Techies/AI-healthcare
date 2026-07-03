const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { Notification } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Helper: send notification to a user via socket and DB
const createChatNotification = async (io, { userId, senderId, senderName, senderRole, conversationId }) => {
  try {
    const title = senderRole === 'doctor' ? `New message from Dr. ${senderName}` : `New message from ${senderName}`;
    const notif = await Notification.create({
      user: userId,
      title,
      message: 'Click to view the conversation',
      type: 'general',
      priority: 'normal',
      isRead: false,
      link: senderRole === 'doctor' ? '/dashboard/appointments' : '/dashboard/doctor-appointments',
      metadata: { conversationId: conversationId.toString(), senderId: senderId.toString(), senderRole },
    });

    // Emit socket event so the bell badge updates immediately
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', {
        title,
        message: 'Click to view the conversation',
        type: 'chat_message',
        metadata: { conversationId: conversationId.toString(), senderId: senderId.toString(), senderRole },
        _id: notif._id,
      });
    }
  } catch (err) {
    console.error('Failed to create chat notification (non-blocking):', err.message);
  }
};

// @desc    Get or create conversation between doctor and patient
// @route   GET /api/chat/conversation?doctorId=...&patientId=...
// @access  Private
exports.getOrCreateConversation = asyncHandler(async (req, res, next) => {
  const { doctorId, patientId } = req.query;

  if (!doctorId || !patientId) {
    return next(new ErrorResponse('doctorId and patientId are required', 400));
  }

  let conversation = await Conversation.findOne({ doctorId, patientId });

  if (!conversation) {
    conversation = await Conversation.create({ doctorId, patientId });
  }

  res.status(200).json({ success: true, data: conversation });
});

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages?conversationId=...
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.query;

  if (!conversationId) {
    return next(new ErrorResponse('conversationId is required', 400));
  }

  const messages = await Message.find({ conversationId })
    .populate('senderId', 'name avatar role')
    .populate('receiverId', 'name avatar role')
    .sort({ createdAt: 1 })
    .limit(200);

  res.status(200).json({ success: true, count: messages.length, data: messages });
});

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { conversationId, receiverId, senderRole, message, attachmentUrl } = req.body;

  if (!conversationId || !receiverId) {
    return next(new ErrorResponse('conversationId and receiverId are required', 400));
  }
  if (!message && !attachmentUrl) {
    return next(new ErrorResponse('Message or attachment is required', 400));
  }

  const senderId = req.user.id;

  // 1. Save message
  const newMessage = await Message.create({
    conversationId,
    senderId,
    receiverId,
    senderRole,
    message: message || '',
    attachmentUrl: attachmentUrl || null,
    isRead: false,
  });

  const populated = await newMessage.populate('senderId', 'name avatar role');

  // 2. Update conversation
  const unreadField = senderRole === 'doctor' ? 'unreadCountPatient' : 'unreadCountDoctor';
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message || '📎 Attachment',
    lastMessageAt: new Date(),
    $inc: { [unreadField]: 1 },
  });

  // 3. Emit real-time message to receiver
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${receiverId}`).emit('chat_message', populated);
  }

  // 4. Create notification (non-blocking)
  await createChatNotification(io, {
    userId: receiverId,
    senderId,
    senderName: req.user.name,
    senderRole,
    conversationId,
  });

  res.status(201).json({ success: true, messageData: populated });
});

// @desc    Mark conversation messages as read
// @route   POST /api/chat/mark-read
// @access  Private
exports.markRead = asyncHandler(async (req, res, next) => {
  const { conversationId, userId } = req.body;

  if (!conversationId || !userId) {
    return next(new ErrorResponse('conversationId and userId are required', 400));
  }

  // 1. Mark messages as read
  await Message.updateMany(
    { conversationId, receiverId: userId, isRead: false },
    { $set: { isRead: true } }
  );

  // 2. Determine which unread counter to reset based on who is reading
  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    const resetField =
      conversation.doctorId.toString() === userId ? 'unreadCountDoctor' : 'unreadCountPatient';
    conversation[resetField] = 0;
    await conversation.save();

    // 3. Notify the sender their messages have been read
    const otherUserId =
      conversation.doctorId.toString() === userId
        ? conversation.patientId.toString()
        : conversation.doctorId.toString();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${otherUserId}`).emit('messages_read', { by: userId, conversationId });
    }
  }

  // 4. Mark related chat notifications as read
  await Notification.updateMany(
    { user: userId, 'metadata.conversationId': conversationId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.status(200).json({ success: true, message: 'Messages marked as read' });
});
