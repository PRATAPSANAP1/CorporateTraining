const config = require('../config/env');

/**
 * Global error handler middleware.
 *
 * Catches all errors passed via `next(error)` and returns a standardized
 * JSON response. Handles the following error types specifically:
 *
 * - **Mongoose ValidationError** → 400 with field-level error messages
 * - **Mongoose CastError** → 400 (invalid ObjectId, etc.)
 * - **MongoDB Duplicate Key (code 11000)** → 400 with duplicated field name
 * - **JsonWebTokenError** → 401 invalid token
 * - **TokenExpiredError** → 401 expired token
 * - **All other errors** → 500 Internal Server Error
 *
 * In development mode the error stack trace is included in the response.
 *
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {import('express').Response}
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const duplicatedField = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value entered for: ${duplicatedField}`;
  }

  // JWT Invalid Token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  // JWT Expired Token
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please log in again.';
  }

  // Build response body
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development mode
  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  // Log the error in development
  if (config.nodeEnv === 'development') {
    console.error('❌ Error:', err);
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
