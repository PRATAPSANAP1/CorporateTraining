const mongoose = require('mongoose');

/**
 * Result Schema
 *
 * Stores the outcome of a user's test attempt. Each answer
 * references the original Question, records the selected answer,
 * correctness, and time taken per question. Aggregated stats
 * (total marks, percentage, pass/fail) are stored at the top level.
 */
const resultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: [true, 'Test is required'],
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        selectedAnswer: {
          type: Number,
        },
        isCorrect: {
          type: Boolean,
        },
        timeTaken: {
          type: Number, // seconds
        },
      },
    ],
    totalMarks: {
      type: Number,
    },
    obtainedMarks: {
      type: Number,
    },
    percentage: {
      type: Number,
    },
    passed: {
      type: Boolean,
    },
    timeTaken: {
      type: Number, // total seconds
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound index on user + test.
 * Enables efficient lookup of a user's results for a specific test
 * and supports queries for all results by a user or for a test.
 */
resultSchema.index({ user: 1, test: 1 });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
