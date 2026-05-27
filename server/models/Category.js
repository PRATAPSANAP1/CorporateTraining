const mongoose = require('mongoose');

/**
 * Category Schema
 *
 * Represents a top-level category for questions and tests
 * (e.g. Aptitude, Technical, Coding). Each category has a type
 * that classifies it into one of the three pillars.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['aptitude', 'technical', 'coding'],
        message: 'Type must be aptitude, technical, or coding',
      },
      required: [true, 'Category type is required'],
    },
    description: {
      type: String,
    },
    icon: {
      type: String,
      default: 'BookOpen',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
