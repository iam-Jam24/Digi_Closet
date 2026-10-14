const { auth } = require('../config/firebaseAdmin');
const User = require('../models/User');

/**
 * Verifies the Firebase ID token sent in the Authorization header,
 * then resolves (or lazily creates) the corresponding MongoDB User
 * document. Downstream handlers must use req.user._id (Mongo ObjectId)
 * for all ownership checks — never trust any user id supplied by the client.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const idToken = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    let user = await User.findOne({ firebaseUid: decoded.uid });

    // Lazily create the Mongo profile on first authenticated request
    // (covers users created directly via Firebase Auth, e.g. right after signup).
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || decoded.email?.split('@')[0] || 'New User',
        email: decoded.email,
      });
    }

    req.user = user;
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
