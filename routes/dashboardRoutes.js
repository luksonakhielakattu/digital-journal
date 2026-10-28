const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');
const { VALID_MOODS } = require('../models/JournalEntry');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/**
 * GET /api/dashboard/stats
 * Aggregate dynamic statistics for the authenticated user's dashboard.
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Total entries
    const totalEntries = await JournalEntry.countDocuments({ user: userId });

    // 2. Entries created today (local calendar day bounds)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayEntriesCount = await JournalEntry.countDocuments({
      user: userId,
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    // 3. Favorites count
    const favoritesCount = await JournalEntry.countDocuments({
      user: userId,
      isFavorite: true,
    });

    // 4. Mood distribution aggregation
    const moodAggregation = await JournalEntry.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
    ]);

    // Build complete mood distribution map covering all valid moods
    const moodDistribution = {};
    VALID_MOODS.forEach((m) => {
      moodDistribution[m] = 0;
    });

    moodAggregation.forEach((item) => {
      if (item._id && moodDistribution.hasOwnProperty(item._id)) {
        moodDistribution[item._id] = item.count;
      }
    });

    // Calculate percentages
    const moodPercentages = {};
    VALID_MOODS.forEach((m) => {
      moodPercentages[m] = totalEntries > 0
        ? Math.round((moodDistribution[m] / totalEntries) * 100)
        : 0;
    });

    // Most dominant mood
    let dominantMood = 'None';
    let maxMoodCount = 0;
    VALID_MOODS.forEach((m) => {
      if (moodDistribution[m] > maxMoodCount) {
        maxMoodCount = moodDistribution[m];
        dominantMood = m;
      }
    });

    // 5. Total words written
    const wordsAggregation = await JournalEntry.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalWords: { $sum: '$wordCount' } } },
    ]);
    const totalWords = wordsAggregation.length > 0 ? wordsAggregation[0].totalWords : 0;

    // 6. Recent entries (latest 5)
    const recentEntries = await JournalEntry.find({ user: userId })
      .sort({ date: -1, _id: -1 })
      .limit(5);

    // 7. Recent favorite entries (latest 3)
    const recentFavorites = await JournalEntry.find({ user: userId, isFavorite: true })
      .sort({ date: -1, _id: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      stats: {
        totalEntries,
        todayEntriesCount,
        favoritesCount,
        totalWords,
        dominantMood,
        moodDistribution,
        moodPercentages,
      },
      recentEntries,
      recentFavorites,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate dashboard statistics.',
    });
  }
});

module.exports = router;
