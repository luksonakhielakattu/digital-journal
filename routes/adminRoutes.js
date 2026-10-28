const express = require('express');
const router = express.Router();
const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');
const { requireAuth } = require('../middleware/auth');

// Admin authorization middleware
function requireAdmin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.email === 'admin@journal.com')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator privileges required.',
  });
}

// All admin routes require authenticated session and admin role
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * Returns all registered accounts, their roles, entry counts, and system metrics
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email role bio createdAt').sort({ createdAt: -1 });
    const totalEntries = await JournalEntry.countDocuments();

    // Map each user with their entry counts
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const entryCount = await JournalEntry.countDocuments({ user: u._id });
        const latestEntry = await JournalEntry.findOne({ user: u._id }, 'title mood date')
          .sort({ date: -1 });

        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role || (u.email === 'admin@journal.com' ? 'admin' : 'user'),
          bio: u.bio,
          createdAt: u.createdAt,
          entryCount,
          latestEntry: latestEntry ? {
            title: latestEntry.title,
            mood: latestEntry.mood,
            date: latestEntry.date,
          } : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      totalUsers: users.length,
      totalSystemEntries: totalEntries,
      users: usersWithStats,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve registered users.',
    });
  }
});

module.exports = router;
