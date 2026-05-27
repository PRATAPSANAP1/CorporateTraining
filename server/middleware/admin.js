const { errorResponse } = require('../utils/apiResponse');

/**
 * Admin authorization middleware.
 *
 * Must be used AFTER the `auth` middleware so that `req.user` is populated.
 * Checks whether the authenticated user has the 'admin' role.
 * Returns 403 Forbidden if the user is not an admin.
 *
 * @param {import('express').Request} req - Express request object (must have req.user).
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {void}
 *
 * @example
 * router.get('/admin-only', auth, admin, adminController.dashboard);
 */
const admin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(
      res,
      401,
      'Not authorized, authentication required before admin check'
    );
  }

  if (req.user.role !== 'admin') {
    return errorResponse(
      res,
      403,
      'Forbidden: Admin access required'
    );
  }

  next();
};

module.exports = admin;
