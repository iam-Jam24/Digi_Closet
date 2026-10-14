const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimitMiddleware');
const { analyze } = require('../controllers/fashionCriticController');

const router = express.Router();

router.use(authenticate);
router.post('/analyze', aiRateLimiter, upload.single('image'), analyze);

module.exports = router;
