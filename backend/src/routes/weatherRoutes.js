const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { getWeather } = require('../controllers/weatherController');

const router = express.Router();

router.use(authenticate);
router.get('/', getWeather);

module.exports = router;
