const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimitMiddleware');
const { createTryOn, getTryOn } = require('../controllers/tryOnController');

const router = express.Router();

router.use(authenticate);
router.post(
  '/',
  aiRateLimiter,
  upload.fields([{ name: 'userPhoto', maxCount: 1 }, { name: 'garmentPhoto', maxCount: 1 }]),
  createTryOn
);
router.get('/:id', getTryOn);

module.exports = router;
