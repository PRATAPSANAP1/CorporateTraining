const User = require('../models/User');

/**
 * Updates a user's activity streak dynamically based on the current date.
 * If the user's last active date was yesterday, the streak increments by 1.
 * If they are already active today, the streak is maintained.
 * If they missed a day, the streak resets to 1.
 * 
 * @param {string} userId - Mongoose ObjectId of the user.
 * @returns {Promise<Object>} - Updated User streak object.
 */
const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const today = new Date().toDateString();
    const lastActive = user.streak.lastActiveDate
      ? new Date(user.streak.lastActiveDate).toDateString()
      : null;

    if (lastActive !== today) {
      let currentStreak = user.streak.currentStreak || 0;
      let longestStreak = user.streak.longestStreak || 0;

      if (lastActive) {
        const diffTime = Math.abs(new Date(today) - new Date(lastActive));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      user.streak.currentStreak = currentStreak;
      user.streak.longestStreak = longestStreak;
      user.streak.lastActiveDate = new Date();
      await user.save();
      console.log(`Streak updated for user ${userId}. Streak: ${currentStreak}`);
    }

    return user.streak;
  } catch (error) {
    console.error(`Error updating streak for user ${userId}:`, error.message);
    return null;
  }
};

module.exports = updateStreak;
