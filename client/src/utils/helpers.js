import { DIFFICULTY_COLORS, SUBMISSION_STATUS } from './constants';

/**
 * Format a date string/object into a human-readable format
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  try {
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format a date with time
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format seconds into MM:SS display format (e.g. for test timer)
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string "MM:SS"
 */
export const formatTime = (seconds) => {
  if (seconds == null || seconds < 0) return '00:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Extract initials from a full name (max 2 characters)
 * @param {string} name - Full name
 * @returns {string} Uppercase initials
 */
export const getInitials = (name) => {
  if (!name) return '?';

  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

/**
 * Truncate text to a maximum length, appending ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum character length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
};

/**
 * Calculate percentage with optional decimal places
 * @param {number} obtained - Obtained value
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {number} Percentage value
 */
export const calculatePercentage = (obtained, total, decimals = 1) => {
  if (!total || total === 0) return 0;
  const pct = (obtained / total) * 100;
  return Number(pct.toFixed(decimals));
};

/**
 * Get Tailwind CSS color classes for a difficulty level
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @returns {object} Color classes { bg, text, border, dot, gradient }
 */
export const getDifficultyColor = (difficulty) => {
  const key = difficulty?.toLowerCase();
  return DIFFICULTY_COLORS[key] || DIFFICULTY_COLORS.medium;
};

/**
 * Get color information for a coding submission status
 * @param {string} status - Submission status code
 * @returns {object} Status info { label, color, bg }
 */
export const getStatusColor = (status) => {
  const key = status?.toUpperCase()?.replace(/\s+/g, '_');
  return SUBMISSION_STATUS[key] || SUBMISSION_STATUS.PENDING;
};

/**
 * Create a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function with cancel method
 */
export const debounce = (func, wait = 300) => {
  let timeoutId;

  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debounced;
};

/**
 * Generate a relative time string (e.g. "2 hours ago")
 * @param {string|Date} date
 * @returns {string}
 */
export const timeAgo = (date) => {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
};

/**
 * Capitalize the first letter of a string
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Clamp a number between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Format a large number with K/M suffix
 * @param {number} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num == null) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

/**
 * Generate a random color class for avatar backgrounds
 * @param {string} name - User's name to deterministically pick a color
 * @returns {string} Tailwind gradient class
 */
export const getAvatarColor = (name) => {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-fuchsia-500 to-pink-600',
  ];

  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

/**
 * Build query string from params object, filtering out empty values
 * @param {object} params
 * @returns {string}
 */
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};
