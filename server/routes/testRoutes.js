const express = require('express');
const { body } = require('express-validator');
const {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  startTest,
  submitTest,
} = require('../controllers/testController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');

const router = express.Router();

const testValidation = [
  body('name').trim().notEmpty().withMessage('Test name is required'),
  body('category').isMongoId().withMessage('Category ID is required and must be valid'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
  body('totalTime').isInt({ min: 1 }).withMessage('Total time in minutes is required'),
];

// Student & Admin (Private)
router.get('/', auth, getTests);
router.get('/:id', auth, getTest);
router.post('/:id/start', auth, startTest);
router.post('/:id/submit', auth, submitTest);

// Admin Only
router.post('/', auth, admin, validate(testValidation), createTest);
router.put('/:id', auth, admin, updateTest);
router.delete('/:id', auth, admin, deleteTest);

module.exports = router;
