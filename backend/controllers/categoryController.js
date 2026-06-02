const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Question = require('../models/Question');
const Test = require('../models/Test');
const CodingProblem = require('../models/CodingProblem');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };

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

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const questionCount = await Question.countDocuments({ category: categoryId });
    if (questionCount > 0) {
      return errorResponse(res, 400, `Cannot delete category: ${questionCount} questions are associated with it.`);
    }

    const testCount = await Test.countDocuments({ category: categoryId });
    if (testCount > 0) {
      return errorResponse(res, 400, `Cannot delete category: ${testCount} tests are associated with it.`);
    }

    const problemCount = await CodingProblem.countDocuments({ category: categoryId });
    if (problemCount > 0) {
      return errorResponse(res, 400, `Cannot delete category: ${problemCount} coding problems are associated with it.`);
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    await Subcategory.deleteMany({ category: categoryId });

    return successResponse(res, 200, 'Category and associated subcategories deleted successfully');
  } catch (error) {
    console.error('Delete category error:', error.message);
    return errorResponse(res, 500, 'Server error deleting category');
  }
};

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

const createSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return errorResponse(res, 404, 'Parent category not found');
    }

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

const deleteSubcategory = async (req, res) => {
  try {
    const subcategoryId = req.params.id;

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

const bulkImportSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { subcategories } = req.body;

    if (!Array.isArray(subcategories) || subcategories.length === 0) {
      return errorResponse(res, 400, 'Please provide an array of subcategories to import');
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return errorResponse(res, 404, 'Parent category not found');
    }

    const errors = [];
    const validSubcategories = [];

    const existingSubs = await Subcategory.find({ category: categoryId });
    const existingSubNames = new Set(existingSubs.map(s => s.name.toLowerCase().trim()));

    for (let i = 0; i < subcategories.length; i++) {
      const item = subcategories[i];
      const index = i + 1;
      let name = '';
      let description = '';
      let isActive = true;

      if (typeof item === 'string') {
        name = item.trim();
      } else if (item && typeof item === 'object') {
        name = (item.name || '').trim();
        description = item.description || '';
        if (item.isActive !== undefined) {
          isActive = !!item.isActive;
        }
      }

      if (!name) {
        errors.push(`Row ${index}: Subcategory name is required`);
        continue;
      }

      const lowerName = name.toLowerCase();

      if (existingSubNames.has(lowerName)) {
        errors.push(`Row ${index}: Subcategory "${name}" already exists in this category`);
        continue;
      }

      const duplicateInBatch = validSubcategories.some(x => x.name.toLowerCase() === lowerName);
      if (duplicateInBatch) {
        errors.push(`Row ${index}: Subcategory "${name}" is duplicated within the pasted list`);
        continue;
      }

      validSubcategories.push({
        name,
        category: categoryId,
        description,
        isActive
      });
    }

    if (errors.length > 0) {
      return errorResponse(res, 400, 'Validation failed for some subcategories', errors);
    }

    const inserted = await Subcategory.insertMany(validSubcategories);

    return successResponse(res, 201, `Successfully imported ${inserted.length} subcategories`, {
      importedCount: inserted.length,
      subcategories: inserted
    });
  } catch (error) {
    console.error('Bulk subcategory import error:', error.message);
    return errorResponse(res, 500, 'Server error during bulk subcategory import');
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
  deleteSubcategory,
  bulkImportSubcategories
};

