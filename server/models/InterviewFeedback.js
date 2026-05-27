const mongoose = require('mongoose');

/**
 * InterviewFeedback Schema
 *
 * Stores feedback from AI-powered mock interview sessions.
 * Supports both HR and technical interview types. Records
 * the questions asked, the user's answers, per-answer feedback,
 * composite scores, and session duration.
 */
const interviewFeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['hr', 'technical'],
        message: 'Type must be hr or technical',
      },
      required: [true, 'Interview type is required'],
    },
    questions: {
      type: [String],
    },
    answers: {
      type: [String],
    },
    feedback: {
      type: [String],
    },
    scores: {
      communication: {
        type: Number,
      },
      confidence: {
        type: Number,
      },
      technical: {
        type: Number,
      },
      overall: {
        type: Number,
      },
    },
    duration: {
      type: Number, // seconds
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const InterviewFeedback = mongoose.model('InterviewFeedback', interviewFeedbackSchema);

module.exports = InterviewFeedback;
