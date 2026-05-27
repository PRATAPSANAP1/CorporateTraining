const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 *
 * Represents a registered user of the OITSTACK.
 * Supports both 'student' and 'admin' roles. Passwords are
 * automatically hashed before saving. The password field is
 * excluded from queries by default (select: false).
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: 'Role must be either student or admin',
      },
      default: 'student',
    },
    phone: {
      type: String,
    },
    college: {
      type: String,
      default: 'OITSTACK',
    },
    branch: {
      type: String,
    },
    year: {
      type: String,
    },
    profileImage: {
      type: String,
      default: '',
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    streak: {
      currentStreak: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
      lastActiveDate: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook to hash the password.
 *
 * Only runs when the password field has been modified (or is new).
 * Uses bcryptjs with 10 salt rounds.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare an entered password with the stored hashed password.
 *
 * @param {string} enteredPassword - The plain-text password to compare.
 * @returns {Promise<boolean>} True if the passwords match, false otherwise.
 *
 * @example
 * const user = await User.findById(id).select('+password');
 * const isMatch = await user.matchPassword('myPassword123');
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
