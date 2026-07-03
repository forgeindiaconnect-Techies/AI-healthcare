const express = require('express');
const {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markRead,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/conversation', getOrCreateConversation);
router.get('/messages', getMessages);
router.post('/send', sendMessage);
router.post('/mark-read', markRead);

module.exports = router;
