const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimitMiddleware');
const { validate, colorAnalyzeSchema } = require('../middleware/validateMiddleware');
const { analyze } = require('../controllers/colorAnalyzerController');

const router = express.Router();

router.use(authenticate);
router.post('/analyze', aiRateLimiter, validate(colorAnalyzeSchema), analyze);

module.exports = router;
