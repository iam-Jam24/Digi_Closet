const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { validate, profileSchema } = require('../middleware/validateMiddleware');
const {
  getProfile,
  updateProfile,
  deleteProfileData,
  exportUserData,
  deleteAccount,
} = require('../controllers/profileController');

const router = express.Router();

router.use(authenticate);
router.get('/', getProfile);
router.put('/', validate(profileSchema), updateProfile);
router.delete('/', deleteProfileData);
router.get('/export', exportUserData);
router.delete('/account', deleteAccount);

module.exports = router;

