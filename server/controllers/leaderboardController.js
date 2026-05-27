const Leaderboard = require('../models/Leaderboard');
const Result = require('../models/Result');
const CodingSubmission = require('../models/CodingSubmission');
const CodingProblem = require('../models/CodingProblem');
const Category = require('../models/Category');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get global leaderboard (paginated & searchable)
 * @route   GET /api/leaderboard
 * @access  Private
 */
const getLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Search filter on populated User name
    let matchFilter = {};
    if (search) {
      const matchingUsers = await User.find({
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);
      matchFilter.user = { $in: userIds };
    }

    const leaderboard = await Leaderboard.find(matchFilter)
      .populate('user', 'name college branch year profileImage')
      .sort({ totalScore: -1, updatedAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Leaderboard.countDocuments(matchFilter);

    // Get current user's rank
    const myLeaderboard = await Leaderboard.findOne({ user: req.user._id });
    const myRank = myLeaderboard ? myLeaderboard.rank : null;

    return successResponse(res, 200, 'Leaderboard retrieved successfully', {
      leaderboard,
      myRank,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving leaderboard');
  }
};

/**
 * @desc    Recalculate leaderboard scores & ranks for a user
 * @param   {string} userId - User ID to update
 */
const updateLeaderboard = async (userId) => {
  try {
    // 1. Fetch user's test results
    const results = await Result.find({ user: userId }).populate({
      path: 'test',
      populate: { path: 'category' }
    });

    let aptitudeScore = 0;
    let technicalScore = 0;
    const testsCompleted = results.length;

    results.forEach(resItem => {
      const obtained = resItem.obtainedMarks || 0;
      if (resItem.test && resItem.test.category) {
        const catType = resItem.test.category.type;
        if (catType === 'aptitude') {
          aptitudeScore += obtained;
        } else if (catType === 'technical') {
          technicalScore += obtained;
        }
      }
    });

    // 2. Fetch user's accepted coding submissions
    // Get unique problems solved
    const uniqueSolvedProblems = await CodingSubmission.find({
      user: userId,
      status: 'accepted'
    }).distinct('problem');

    const codingProblemsSolved = uniqueSolvedProblems.length;

    // Sum points of these unique problems
    let codingScore = 0;
    if (codingProblemsSolved > 0) {
      const problems = await CodingProblem.find({ _id: { $in: uniqueSolvedProblems } });
      problems.forEach(p => {
        codingScore += p.points || 100;
      });
    }

    const totalScore = aptitudeScore + technicalScore + codingScore;

    // 3. Update or create Leaderboard entry for this user
    await Leaderboard.findOneAndUpdate(
      { user: userId },
      {
        totalScore,
        testsCompleted,
        codingProblemsSolved,
        aptitudeScore,
        technicalScore,
        codingScore,
        updatedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    // 4. Recalculate ranks of ALL users
    const allLeaderboards = await Leaderboard.find({}).sort({ totalScore: -1, updatedAt: 1 });
    
    // Create bulk operations to update ranks
    const bulkOps = allLeaderboards.map((entry, index) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { rank: index + 1 } }
      }
    }));

    if (bulkOps.length > 0) {
      await Leaderboard.bulkWrite(bulkOps);
    }

    console.log(`Leaderboard updated for user ${userId}. New Score: ${totalScore}`);
  } catch (error) {
    console.error(`Error updating leaderboard for user ${userId}:`, error.message);
  }
};

module.exports = {
  getLeaderboard,
  updateLeaderboard
};
