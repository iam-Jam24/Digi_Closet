const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { locationRateLimiter } = require('../middleware/rateLimitMiddleware');
const { getNearbyStores, getStoreDetails } = require('../controllers/locationFindsController');

const router = express.Router();

router.use(authenticate);
router.use(locationRateLimiter);
router.get('/nearby', getNearbyStores);
router.get('/stores/:id', getStoreDetails);

module.exports = router;
