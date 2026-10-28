const express = require('express');
const router = express.Router();
const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/**
 * GET /api/profile
 * Retrieve user profile and account statistics.
 */
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const totalEntries = await JournalEntry.countDocuments({ user: user._id });

    res.status(200).json({
      success: true,
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        createdAt: user.createdAt,
        totalEntries,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile data.',
    });
  }
});

/**
 * PUT /api/profile
 * Update profile details (name, bio) and optional password change.
 */
router.put('/', async (req, res) => {
  try {
    const { name, bio, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Name update
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long.',
        });
      }
      if (name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot exceed 50 characters.',
        });
      }
      user.name = name.trim();
    }

    // Bio update
    if (bio !== undefined) {
      if (typeof bio === 'string' && bio.length > 250) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 250 characters.',
        });
      }
      user.bio = typeof bio === 'string' ? bio.trim() : '';
    }

    // Optional password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password does not match.',
        });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        });
      }

      user.password = newPassword; // Will trigger pre-save bcrypt hash
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile details.',
    });
  }
});

module.exports = router;
