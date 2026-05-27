const mongoose = require('mongoose');

/**
 * CodingSubmission Schema
 *
 * Records a user's code submission for a specific coding problem.
 * Tracks the language, submitted code, execution results (status,
 * test cases passed, execution time, memory), and any errors.
 */
const codingSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: [true, 'Problem is required'],
    },
    language: {
      type: String,
      required: [true, 'Programming language is required'],
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'accepted',
          'wrong_answer',
          'time_limit_exceeded',
          'memory_limit_exceeded',
          'runtime_error',
          'compilation_error',
          'pending',
        ],
        message: 'Invalid submission status',
      },
      default: 'pending',
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    executionTime: {
      type: Number, // milliseconds
    },
    memoryUsed: {
      type: Number, // KB or MB as returned by judge
    },
    output: {
      type: String,
    },
    error: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound index on user + problem.
 * Enables efficient lookup of all submissions by a user for a specific problem.
 */
codingSubmissionSchema.index({ user: 1, problem: 1 });

const CodingSubmission = mongoose.model('CodingSubmission', codingSubmissionSchema);

module.exports = CodingSubmission;
