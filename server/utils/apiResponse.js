/**
 * Send a standardized success response.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {number} statusCode - HTTP status code (e.g. 200, 201).
 * @param {string} message - Human-readable success message.
 * @param {Object|Array|null} [data=null] - Payload to include in the response.
 * @returns {import('express').Response} The Express response.
 *
 * @example
 * successResponse(res, 200, 'User fetched successfully', { user });
 */
const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error response.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {number} statusCode - HTTP status code (e.g. 400, 401, 500).
 * @param {string} message - Human-readable error message.
 * @param {Array|Object|null} [errors=null] - Detailed error information.
 * @returns {import('express').Response} The Express response.
 *
 * @example
 * errorResponse(res, 400, 'Validation failed', [{ field: 'email', msg: 'Invalid email' }]);
 */
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null && errors !== undefined) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};
