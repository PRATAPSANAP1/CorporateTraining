const crypto = require('crypto');
const { body } = require('express-validator');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const config = require('../config/env');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists');
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Create leaderboard entry for the new user
    await Leaderboard.create({ user: user._id });

    // Generate JWT token
    const token = generateToken(user._id);

    // Build user response (exclude password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      branch: user.branch,
      year: user.year,
      profileImage: user.profileImage,
    };

    return successResponse(res, 201, 'User registered successfully', {
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return errorResponse(res, 500, 'Server error during registration');
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Build user response (exclude password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      college: user.college,
      branch: user.branch,
      year: user.year,
      profileImage: user.profileImage,
    };

    return successResponse(res, 200, 'Login successful', {
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return errorResponse(res, 500, 'Server error during login');
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getProfile = async (req, res) => {
  try {
    return successResponse(res, 200, 'Profile retrieved successfully', {
      user: req.user,
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving profile');
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateProfile = async (req, res) => {
  try {
    // Only allow specific fields to be updated
    const allowedFields = ['name', 'phone', 'college', 'branch', 'year', 'profileImage'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Don't allow email or role changes
    if (req.body.email || req.body.role) {
      return errorResponse(res, 400, 'Email and role cannot be changed through profile update');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return errorResponse(res, 500, 'Server error updating profile');
  }
};

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 404, 'No user found with this email');
    }

    // Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token and store it with an expiry
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your OITSTACK account.</p>
      <p>Click the link below to reset your password. This link is valid for 30 minutes.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4F46E5;color:#fff;border-radius:5px;text-decoration:none;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'OITSTACK - Password Reset',
        html,
      });

      return successResponse(res, 200, 'Password reset email sent successfully');
    } catch (emailError) {
      // If email fails, clear the reset fields
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return errorResponse(res, 500, 'Failed to send reset email. Please try again later.');
    }
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return errorResponse(res, 500, 'Server error processing password reset');
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with valid, non-expired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    // Update the password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return successResponse(res, 200, 'Password reset successful. You can now log in with your new password.');
  } catch (error) {
    console.error('Reset password error:', error.message);
    return errorResponse(res, 500, 'Server error resetting password');
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
};
