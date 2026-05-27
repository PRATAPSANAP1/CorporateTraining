const User = require('../models/User');
const Test = require('../models/Test');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const Result = require('../models/Result');
const Leaderboard = require('../models/Leaderboard');
const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get top-level dashboard statistics (Admin only)
 * @route   GET /api/analytics/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTests = await Test.countDocuments({ isActive: true });
    const totalQuestions = await Question.countDocuments({ isActive: true });
    const totalCodingProblems = await CodingProblem.countDocuments({ isActive: true });

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await User.countDocuments({
      role: 'student',
      createdAt: { $gte: sevenDaysAgo }
    });

    // Tests taken today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const testsTakenToday = await Result.countDocuments({
      submittedAt: { $gte: startOfToday }
    });

    // Recent 5 registered students
    const recentStudents = await User.find({ role: 'student' })
      .select('name email branch year createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 test submissions
    const recentSubmissions = await Result.find({})
      .populate('user', 'name')
      .populate('test', 'name')
      .sort({ submittedAt: -1 })
      .limit(5);

    return successResponse(res, 200, 'Dashboard statistics retrieved', {
      stats: {
        totalStudents,
        totalTests,
        totalQuestions,
        totalCodingProblems,
        recentRegistrations,
        testsTakenToday
      },
      recentStudents,
      recentSubmissions
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving dashboard statistics');
  }
};

/**
 * @desc    Get student performance analytics (Admin only)
 * @route   GET /api/analytics/students
 * @access  Private/Admin
 */
const getStudentAnalytics = async (req, res) => {
  try {
    // 1. Performance distribution (Score ranges from Leaderboard)
    const scoreRanges = await Leaderboard.aggregate([
      {
        $bucket: {
          groupBy: '$totalScore',
          boundaries: [0, 100, 300, 500, 1000, 5000],
          default: '5000+',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const formattedRanges = scoreRanges.map(range => {
      let name = '';
      if (range._id === 0) name = '0-100';
      else if (range._id === 100) name = '100-300';
      else if (range._id === 300) name = '300-500';
      else if (range._id === 500) name = '500-1000';
      else if (range._id === 1000) name = '1000-5000';
      else name = '5000+';
      
      return { name, count: range.count };
    });

    // 2. Average scores by category (Aptitude vs Technical)
    const avgCategoryScores = await Result.aggregate([
      {
        $lookup: {
          from: 'tests',
          localField: 'test',
          foreignField: '_id',
          as: 'testDetails'
        }
      },
      { $unwind: '$testDetails' },
      {
        $lookup: {
          from: 'categories',
          localField: 'testDetails.category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $group: {
          _id: '$categoryDetails.name',
          categoryType: { $first: '$categoryDetails.type' },
          avgScore: { $avg: '$percentage' }
        }
      },
      {
        $project: {
          categoryName: '$_id',
          categoryType: 1,
          avgPercentage: { $round: ['$avgScore', 2] }
        }
      }
    ]);

    // 3. Top performers (top 5 users)
    const topPerformers = await Leaderboard.find({})
      .populate('user', 'name college branch year')
      .sort({ totalScore: -1 })
      .limit(5);

    return successResponse(res, 200, 'Student analytics retrieved', {
      performanceRanges: formattedRanges,
      averageScoresByCategory: avgCategoryScores,
      topPerformers
    });
  } catch (error) {
    console.error('Get student analytics error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving student analytics');
  }
};

/**
 * @desc    Get test performance analytics (Admin only)
 * @route   GET /api/analytics/tests
 * @access  Private/Admin
 */
const getTestAnalytics = async (req, res) => {
  try {
    // 1. Completion rates and average scores per test
    const testPerformance = await Result.aggregate([
      {
        $group: {
          _id: '$test',
          submissionsCount: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' },
          passedCount: {
            $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'tests',
          localField: '_id',
          foreignField: '_id',
          as: 'testInfo'
        }
      },
      { $unwind: '$testInfo' },
      {
        $project: {
          testName: '$testInfo.name',
          totalSubmissions: '$submissionsCount',
          averagePercentage: { $round: ['$avgPercentage', 2] },
          passRate: {
            $round: [
              { $multiply: [{ $divide: ['$passedCount', '$submissionsCount'] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { totalSubmissions: -1 } }
    ]);

    // 2. Tests count by difficulty
    const testDifficultyCount = await Test.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    return successResponse(res, 200, 'Test analytics retrieved', {
      testPerformance,
      testDifficultyCount
    });
  } catch (error) {
    console.error('Get test analytics error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving test analytics');
  }
};

/**
 * @desc    Get category-wise questions and tests distributions (Admin only)
 * @route   GET /api/analytics/categories
 * @access  Private/Admin
 */
const getCategoryAnalytics = async (req, res) => {
  try {
    // 1. Questions per category
    const questionsPerCategory = await Question.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'catInfo'
        }
      },
      { $unwind: '$catInfo' },
      {
        $project: {
          categoryName: '$catInfo.name',
          type: '$catInfo.type',
          count: 1
        }
      }
    ]);

    // 2. Tests per category
    const testsPerCategory = await Test.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'catInfo'
        }
      },
      { $unwind: '$catInfo' },
      {
        $project: {
          categoryName: '$catInfo.name',
          type: '$catInfo.type',
          count: 1
        }
      }
    ]);

    return successResponse(res, 200, 'Category analytics retrieved', {
      questionsDistribution: questionsPerCategory,
      testsDistribution: testsPerCategory
    });
  } catch (error) {
    console.error('Get category analytics error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving category analytics');
  }
};

module.exports = {
  getDashboardStats,
  getStudentAnalytics,
  getTestAnalytics,
  getCategoryAnalytics
};
