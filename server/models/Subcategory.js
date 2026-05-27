const mongoose = require('mongoose');

/**
 * Subcategory Schema
 *
 * Represents a subcategory within a parent Category
 * (e.g. "Percentages" under "Aptitude", or "Arrays" under "DSA").
 * The combination of name + category must be unique (compound index).
 */
const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
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

/**
 * Compound unique index on name + category.
 * Prevents duplicate subcategory names within the same category
 * while allowing the same name across different categories.
 */
subcategorySchema.index({ name: 1, category: 1 }, { unique: true });

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

module.exports = Subcategory;
