const express = require('express');
const { getProfile, updateProfile } = require('../controllers/profileController');
const authenticate = require('../middleware/authMiddleware');
const { validate, profileSchema } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getProfile);
router.put('/', validate(profileSchema), updateProfile);

module.exports = router;
