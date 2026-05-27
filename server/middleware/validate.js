const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Validation middleware factory.
 *
 * Accepts an array of express-validator validation chains, runs them
 * sequentially against the request, and returns a 400 response with
 * detailed error information if any validations fail. If all validations
 * pass, control moves to the next middleware.
 *
 * @param {import('express-validator').ValidationChain[]} validations - Array of express-validator validation chains.
 * @returns {import('express').RequestHandler} Express middleware function.
 *
 * @example
 * const { body } = require('express-validator');
 *
 * router.post(
 *   '/register',
 *   validate([
 *     body('email').isEmail().withMessage('Please provide a valid email'),
 *     body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
 *   ]),
 *   authController.register
 * );
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations sequentially
    for (const validation of validations) {
      await validation.run(req);
    }

    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const extractedErrors = errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      }));

      return errorResponse(res, 400, 'Validation failed', extractedErrors);
    }

    next();
  };
};

module.exports = validate;
