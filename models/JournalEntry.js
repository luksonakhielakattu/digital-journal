const mongoose = require('mongoose');

const VALID_MOODS = ['Happy', 'Calm', 'Excited', 'Sad', 'Stressed', 'Grateful'];

const journalEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Entry must be associated with a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an entry title'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    content: {
      type: String,
      required: [true, 'Journal content cannot be blank'],
      trim: true,
      minlength: [1, 'Content cannot be empty'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    mood: {
      type: String,
      required: [true, 'Please select a mood for this entry'],
      enum: {
        values: VALID_MOODS,
        message: '{VALUE} is not a supported mood',
      },
      default: 'Calm',
    },
    tags: {
      type: [String],
      default: [],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate word count before saving
journalEntrySchema.pre('save', function (next) {
  if (this.content) {
    const words = this.content.trim().split(/\s+/).filter(Boolean);
    this.wordCount = words.length;
  } else {
    this.wordCount = 0;
  }

  // Normalize tags: trim and filter out empties
  if (Array.isArray(this.tags)) {
    this.tags = this.tags
      .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
      .filter((t) => t.length > 0);
  }

  next();
});

// Compound indexes for user query performance
journalEntrySchema.index({ user: 1, date: -1 });
journalEntrySchema.index({ user: 1, mood: 1 });
journalEntrySchema.index({ user: 1, isFavorite: 1 });
journalEntrySchema.index({ user: 1, tags: 1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
module.exports.VALID_MOODS = VALID_MOODS;
