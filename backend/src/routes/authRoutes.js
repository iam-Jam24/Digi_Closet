const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { sync, getMe } = require('../controllers/authController');

const router = express.Router();

router.use(authenticate);
router.post('/sync', sync);
router.get('/me', getMe);

module.exports = router;
