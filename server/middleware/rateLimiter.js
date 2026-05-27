const rateLimit = require('express-rate-limit');

/**
 * General rate limiter.
 *
 * Limits each IP to 100 requests per 15-minute window.
 * Suitable for general API endpoints.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes',
  },
});

/**
 * Authentication rate limiter.
 *
 * Limits each IP to 20 requests per 15-minute window.
 * Suitable for login, register, and password-reset endpoints
 * to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
};
