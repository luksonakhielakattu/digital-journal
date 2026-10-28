const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const JournalEntry = require('../models/JournalEntry');
const { VALID_MOODS } = require('../models/JournalEntry');
const { requireAuth } = require('../middleware/auth');

// All journal routes require authentication
router.use(requireAuth);

/**
 * GET /api/journal
 * List journal entries with search, filter, and pagination options.
 */
router.get('/', async (req, res) => {
  try {
    const {
      search,
      mood,
      tag,
      favorite,
      startDate,
      endDate,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { user: req.user._id };

    // Search query on title and content
    if (search && typeof search === 'string' && search.trim() !== '') {
      const cleanSearch = search.trim();
      query.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { content: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    // Filter by mood
    if (mood && mood !== 'All' && VALID_MOODS.includes(mood)) {
      query.mood = mood;
    }

    // Filter by tag
    if (tag && typeof tag === 'string' && tag.trim() !== '') {
      query.tags = tag.trim().toLowerCase();
    }

    // Filter by favorite
    if (favorite === 'true') {
      query.isFavorite = true;
    } else if (favorite === 'false') {
      query.isFavorite = false;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          query.date.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          query.date.$lte = end;
        }
      }
      if (Object.keys(query.date).length === 0) {
        delete query.date;
      }
    }

    // Sort order
    let sortOptions = { date: -1, _id: -1 };
    if (sort === 'oldest') {
      sortOptions = { date: 1, _id: 1 };
    } else if (sort === 'title_asc') {
      sortOptions = { title: 1 };
    } else if (sort === 'title_desc') {
      sortOptions = { title: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await JournalEntry.countDocuments(query);
    const entries = await JournalEntry.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: entries.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      entries,
    });
  } catch (error) {
    console.error('Fetch entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve journal entries. Please try again.',
    });
  }
});

/**
 * GET /api/journal/calendar
 * Return lightweight entries mapped for calendar rendering (dates and moods).
 */
router.get('/calendar', async (req, res) => {
  try {
    const { year, month } = req.query; // 1-based month (1-12)
    const query = { user: req.user._id };

    if (year && month) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10) - 1; // 0-indexed for JS Date
      const startDate = new Date(y, m, 1, 0, 0, 0, 0);
      const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const entries = await JournalEntry.find(query, 'title date mood isFavorite tags wordCount')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error('Calendar entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve calendar entries.',
    });
  }
});

/**
 * POST /api/journal
 * Create a new journal entry.
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, date, mood, tags, isFavorite } = req.body;

    // Title validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and cannot be blank.',
      });
    }

    if (title.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 120 characters.',
      });
    }

    // Content validation
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Journal entry content cannot be blank.',
      });
    }

    // Mood validation
    const cleanMood = mood && VALID_MOODS.includes(mood) ? mood : 'Calm';

    // Parse date
    let entryDate = new Date();
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        entryDate = parsed;
      }
    }

    // Parse tags: accept array or comma-separated string
    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === 'string') {
      parsedTags = tags.split(',').map((t) => t.trim());
    }

    const entry = new JournalEntry({
      user: req.user._id,
      title: title.trim(),
      content: content.trim(),
      date: entryDate,
      mood: cleanMood,
      tags: parsedTags,
      isFavorite: Boolean(isFavorite),
    });

    await entry.save();

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully!',
      entry,
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save your journal entry. Please try again.',
    });
  }
});

/**
 * GET /api/journal/:id
 * Retrieve a specific journal entry by its ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal entry ID format.',
      });
    }

    const entry = await JournalEntry.findById(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found.',
      });
    }

    // Authorization check: only owner can access
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to view this journal entry.',
      });
    }

    res.status(200).json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch the journal entry.',
    });
  }
});

/**
 * PUT /api/journal/:id
 * Update an existing journal entry.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, date, mood, tags, isFavorite } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal entry ID format.',
      });
    }

    const entry = await JournalEntry.findById(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found.',
      });
    }

    // Authorization check
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot modify another user\'s journal entry.',
      });
    }

    // Validation
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty.',
        });
      }
      if (title.trim().length > 120) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 120 characters.',
        });
      }
      entry.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Content cannot be empty.',
        });
      }
      entry.content = content.trim();
    }

    if (date !== undefined) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        entry.date = parsed;
      }
    }

    if (mood !== undefined) {
      if (!VALID_MOODS.includes(mood)) {
        return res.status(400).json({
          success: false,
          message: `Mood must be one of: ${VALID_MOODS.join(', ')}`,
        });
      }
      entry.mood = mood;
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        entry.tags = tags;
      } else if (typeof tags === 'string') {
        entry.tags = tags.split(',').map((t) => t.trim());
      }
    }

    if (isFavorite !== undefined) {
      entry.isFavorite = Boolean(isFavorite);
    }

    await entry.save();

    res.status(200).json({
      success: true,
      message: 'Journal entry updated successfully!',
      entry,
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update journal entry.',
    });
  }
});

/**
 * DELETE /api/journal/:id
 * Delete a journal entry permanently.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal entry ID format.',
      });
    }

    const entry = await JournalEntry.findById(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found.',
      });
    }

    // Authorization check
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You cannot delete another user\'s journal entry.',
      });
    }

    await JournalEntry.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Journal entry deleted successfully.',
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete the journal entry.',
    });
  }
});

/**
 * PATCH /api/journal/:id/favorite
 * Toggle or set favorite status for an entry.
 */
router.patch('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal entry ID format.',
      });
    }

    const entry = await JournalEntry.findById(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found.',
      });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden.',
      });
    }

    entry.isFavorite = !entry.isFavorite;
    await entry.save();

    res.status(200).json({
      success: true,
      message: entry.isFavorite ? 'Marked as favorite' : 'Removed from favorites',
      isFavorite: entry.isFavorite,
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update favorite status.',
    });
  }
});

module.exports = router;
