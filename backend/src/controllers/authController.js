const User = require('../models/User');

/**
 * Registration and login happen entirely on the client via Firebase
 * Authentication (email/password, and Google sign-in where configured).
 * The backend never handles passwords. These endpoints only sync/read
 * the MongoDB profile that mirrors the Firebase-authenticated user.
 */

// POST /api/auth/sync — called right after Firebase signup to ensure the
// Mongo profile has the correct display name (authMiddleware already
// lazily creates a baseline User document for any authenticated request).
const sync = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (name && name.trim() && name.trim() !== req.user.name) {
      req.user.name = name.trim();
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Account synced.',
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sync, getMe };
