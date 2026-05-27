const mongoose = require('mongoose');

/**
 * Leaderboard Schema
 *
 * Aggregated performance record per user. Tracks total score,
 * per-category scores (aptitude, technical, coding), number of
 * tests completed, coding problems solved, and computed rank.
 * The totalScore index enables efficient ranking queries.
 */
const leaderboardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    testsCompleted: {
      type: Number,
      default: 0,
    },
    codingProblemsSolved: {
      type: Number,
      default: 0,
    },
    aptitudeScore: {
      type: Number,
      default: 0,
    },
    technicalScore: {
      type: Number,
      default: 0,
    },
    codingScore: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Descending index on totalScore for efficient leaderboard ranking queries.
 */
leaderboardSchema.index({ totalScore: -1 });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard;
