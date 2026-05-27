const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Question = require('../models/Question');
const Test = require('../models/Test');
const CodingProblem = require('../models/CodingProblem');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    
    // Admins can see all, students see active only
    if (req.user && req.user.role === 'admin') {
      delete filter.isActive;
    }

    if (type) {
      filter.type = type;
    }

    const categories = await Category.find(filter);
    return successResponse(res, 200, 'Categories retrieved successfully', categories);
  } catch (error) {
    console.error('Get categories error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving categories');
  }
};

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Private
 */
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }
    return successResponse(res, 200, 'Category retrieved successfully', category);
  } catch (error) {
    console.error('Get category error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving category');
  }
};

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res) => {
  try {
    const { name, type, description, icon, isActive } = req.body;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return errorResponse(res, 400, 'Category already exists');
    }

    const category = await Category.create({
      name,
      type,
      description,
      icon,
      isActive
    });

    return successResponse(res, 201, 'Category created successfully', category);
  } catch (error) {
    console.error('Create category error:', error.message);
    return errorResponse(res, 500, 'Server error creating category');
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    return successResponse(res, 200, 'Category updated successfully', category);
  } catch (error) {
    console.error('Update category error:', error.message);
    return errorResponse(res, 500, 'Server error updating category');
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if questions are linked to this category
    const questionCount = await Question.countDocuments({ category: categoryId });
    if (questionCount > 0) {
      return errorResponse(res, 400, `Cannot delete category: ${questionCount} questions are associated with it.`);
    }

    // Check if tests are linked
    const testCount = await Test.countDocuments({ category: categoryId });
    if (testCount > 0) {
      return errorResponse(res, 400, `Cannot delete category: ${testCount} tests are associated with it.`);
    }

    // Check if coding problems are linked
    const problemCount = await CodingProblem.countDocuments({ category: categoryId });
    if (problemCount > 0) {
      return errorResponse(res, 400, `Cannot delete category: ${problemCount} coding problems are associated with it.`);
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    // Delete subcategories of this category as well
    await Subcategory.deleteMany({ category: categoryId });

    return successResponse(res, 200, 'Category and associated subcategories deleted successfully');
  } catch (error) {
    console.error('Delete category error:', error.message);
    return errorResponse(res, 500, 'Server error deleting category');
  }
};

/**
 * @desc    Get subcategories for a category
 * @route   GET /api/categories/:categoryId/subcategories
 * @access  Private
 */
const getSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const filter = { category: categoryId, isActive: true };

    if (req.user && req.user.role === 'admin') {
      delete filter.isActive;
    }

    const subcategories = await Subcategory.find(filter);
    return successResponse(res, 200, 'Subcategories retrieved successfully', subcategories);
  } catch (error) {
    console.error('Get subcategories error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving subcategories');
  }
};

/**
 * @desc    Create subcategory
 * @route   POST /api/categories/:categoryId/subcategories
 * @access  Private/Admin
 */
const createSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return errorResponse(res, 404, 'Parent category not found');
    }

    // Check if subcategory with same name already exists in this category
    const existingSub = await Subcategory.findOne({ name, category: categoryId });
    if (existingSub) {
      return errorResponse(res, 400, 'Subcategory with this name already exists in the category');
    }

    const subcategory = await Subcategory.create({
      name,
      category: categoryId,
      description,
      isActive
    });

    return successResponse(res, 201, 'Subcategory created successfully', subcategory);
  } catch (error) {
    console.error('Create subcategory error:', error.message);
    return errorResponse(res, 500, 'Server error creating subcategory');
  }
};

/**
 * @desc    Update subcategory
 * @route   PUT /api/categories/subcategories/:id
 * @access  Private/Admin
 */
const updateSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!subcategory) {
      return errorResponse(res, 404, 'Subcategory not found');
    }

    return successResponse(res, 200, 'Subcategory updated successfully', subcategory);
  } catch (error) {
    console.error('Update subcategory error:', error.message);
    return errorResponse(res, 500, 'Server error updating subcategory');
  }
};

/**
 * @desc    Delete subcategory
 * @route   DELETE /api/categories/subcategories/:id
 * @access  Private/Admin
 */
const deleteSubcategory = async (req, res) => {
  try {
    const subcategoryId = req.params.id;

    // Check if questions are linked to this subcategory
    const questionCount = await Question.countDocuments({ subcategory: subcategoryId });
    if (questionCount > 0) {
      return errorResponse(res, 400, `Cannot delete subcategory: ${questionCount} questions are associated with it.`);
    }

    const subcategory = await Subcategory.findByIdAndDelete(subcategoryId);
    if (!subcategory) {
      return errorResponse(res, 404, 'Subcategory not found');
    }

    return successResponse(res, 200, 'Subcategory deleted successfully');
  } catch (error) {
    console.error('Delete subcategory error:', error.message);
    return errorResponse(res, 500, 'Server error deleting subcategory');
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
};
