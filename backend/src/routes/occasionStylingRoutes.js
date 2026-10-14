const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimitMiddleware');
const { style } = require('../controllers/occasionStylingController');

const router = express.Router();

router.use(authenticate);
router.post('/occasion', aiRateLimiter, style);

module.exports = router;
