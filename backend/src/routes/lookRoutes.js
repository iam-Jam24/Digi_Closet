const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { upload, parseJsonField } = require('../middleware/uploadMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimitMiddleware');
const {
  getCapabilities, listLooks, createTryOn, analyzeMakeover, createMakeover, updateLook, deleteLook,
} = require('../controllers/lookController');

const router = express.Router();

router.use(authenticate);
router.get('/', listLooks);
router.get('/capabilities', getCapabilities);
router.post('/try-on', aiRateLimiter, upload.single('photo'), parseJsonField, createTryOn);
router.post('/makeover/analyze', aiRateLimiter, upload.single('photo'), analyzeMakeover);
router.post('/makeover', aiRateLimiter, upload.single('photo'), parseJsonField, createMakeover);
router.patch('/:id', updateLook);
router.delete('/:id', deleteLook);

module.exports = router;
