const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimitMiddleware');
const { validate, chatSchema } = require('../middleware/validateMiddleware');
const {
  sendMessage, getConversations, getConversation, deleteConversation,
} = require('../controllers/chatController');

const router = express.Router();

router.use(authenticate);
router.post('/', aiRateLimiter, validate(chatSchema), sendMessage);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);

module.exports = router;
