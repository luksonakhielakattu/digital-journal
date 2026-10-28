const User = require('../models/User');

/**
 * Authentication middleware that verifies session state.
 * If valid session exists, attaches user object to req.user.
 * Otherwise returns 401 Unauthorized JSON response.
 */
async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      // User may have been deleted while session was active
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'User session is no longer valid. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying session.',
    });
  }
}

module.exports = {
  requireAuth,
};
