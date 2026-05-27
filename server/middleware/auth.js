const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Authentication middleware.
 *
 * Extracts the JWT from the Authorization header (Bearer <token>),
 * verifies it against the configured secret, fetches the associated
 * user from the database (excluding the password field), and attaches
 * the user document to `req.user`.
 *
 * Returns 401 if no token is provided, the token is invalid, or the
 * user no longer exists.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
const auth = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return errorResponse(res, 401, 'Not authorized, no token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Fetch user from database (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return errorResponse(res, 401, 'Not authorized, user not found');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Not authorized, invalid token');
    }

    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Not authorized, token has expired');
    }

    return errorResponse(res, 401, 'Not authorized');
  }
};

module.exports = auth;
