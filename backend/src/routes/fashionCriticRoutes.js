const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { upload, parseJsonField } = require('../middleware/uploadMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimitMiddleware');
const { analyze, visualize, capabilities } = require('../controllers/fashionCriticController');

const router = express.Router();

router.use(authenticate);
router.post('/analyze', aiRateLimiter, upload.single('image'), analyze);
router.post('/visualize', aiRateLimiter, upload.single('image'), parseJsonField, visualize);
router.get('/capabilities', capabilities);

module.exports = router;
