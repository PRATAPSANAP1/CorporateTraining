const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate a signed JWT token for a given user ID.
 *
 * @param {string} userId - The MongoDB ObjectId of the user (as a string).
 * @returns {string} A signed JWT token string.
 *
 * @example
 * const token = generateToken(user._id);
 * // => "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

module.exports = generateToken;
