const express = require('express');
const {
  getChatHistory,
  sendMessage,
  markAsRead,
  uploadChatFile
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(sendMessage);

router.route('/:userId')
  .get(getChatHistory);

router.route('/:userId/read')
  .put(markAsRead);

router.route('/upload')
  .post(uploadChatFile);

module.exports = router;
