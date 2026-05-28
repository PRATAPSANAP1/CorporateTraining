const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');
const { updateLeaderboard } = require('./leaderboardController');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getTests = async (req, res) => {
  try {
    const { category, subcategory, difficulty } = req.query;
    const filter = { isActive: true };

    if (req.user && req.user.role === 'admin') {
      delete filter.isActive;
    }

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (difficulty) filter.difficulty = difficulty;

    const tests = await Test.find(filter)
      .populate('category', 'name type')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Tests retrieved successfully', tests);
  } catch (error) {
    console.error('Get tests error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving tests');
  }
};

const getTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('category', 'name type')
      .populate('subcategory', 'name');

    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    if (req.user.role !== 'admin') {
      const studentTestView = test.toObject();
      delete studentTestView.questions; // Strip questions to prevent inspecting answers
      return successResponse(res, 200, 'Test details retrieved successfully', studentTestView);
    }

    const adminTest = await Test.findById(req.params.id)
      .populate('category', 'name type')
      .populate('subcategory', 'name')
      .populate('questions');

    return successResponse(res, 200, 'Test details retrieved successfully', adminTest);
  } catch (error) {
    console.error('Get test error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving test');
  }
};

const createTest = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      questions,
      totalQuestions,
      totalTime,
      passingMarks,
      negativeMarking,
      negativeMarkValue,
      randomizeQuestions,
      shuffleOptions,
      difficulty,
      isActive,
      startDate,
      endDate,
    } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return errorResponse(res, 400, 'A test must have at least one question');
    }

    const test = await Test.create({
      name,
      description,
      category,
      subcategory,
      questions,
      totalQuestions: totalQuestions || questions.length,
      totalTime,
      passingMarks: passingMarks || 0,
      negativeMarking: negativeMarking || false,
      negativeMarkValue: negativeMarkValue || 0,
      randomizeQuestions: randomizeQuestions !== undefined ? randomizeQuestions : true,
      shuffleOptions: shuffleOptions || false,
      difficulty: difficulty || 'mixed',
      isActive: isActive !== undefined ? isActive : true,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    return successResponse(res, 201, 'Test created successfully', test);
  } catch (error) {
    console.error('Create test error:', error.message);
    return errorResponse(res, 500, 'Server error creating test');
  }
};

const updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    return successResponse(res, 200, 'Test updated successfully', test);
  } catch (error) {
    console.error('Update test error:', error.message);
    return errorResponse(res, 500, 'Server error updating test');
  }
};

const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    return successResponse(res, 200, 'Test deleted successfully');
  } catch (error) {
    console.error('Delete test error:', error.message);
    return errorResponse(res, 500, 'Server error deleting test');
  }
};

const startTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('category', 'name type')
      .populate('subcategory', 'name')
      .populate({
        path: 'questions',
        select: '-correctAnswer -explanation', // Exclude answers and explanations
      });

    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    if (!test.isActive) {
      return errorResponse(res, 403, 'This test is currently inactive');
    }

    const now = new Date();
    if (test.startDate && now < test.startDate) {
      return errorResponse(res, 400, 'This test has not started yet');
    }
    if (test.endDate && now > test.endDate) {
      return errorResponse(res, 400, 'This test has ended');
    }

    let testQuestions = [...test.questions];

    if (test.randomizeQuestions) {
      for (let i = testQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [testQuestions[i], testQuestions[j]] = [testQuestions[j], testQuestions[i]];
      }
    }

    const testData = test.toObject();
    testData.questions = testQuestions;

    return successResponse(res, 200, 'Test started successfully', testData);
  } catch (error) {
    console.error('Start test error:', error.message);
    return errorResponse(res, 500, 'Server error starting test');
  }
};

const submitTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const { answers, timeTaken, autoSubmitted } = req.body; // answers: [{ question: id, selectedAnswer: index, timeTaken: seconds }]

    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    let obtainedMarks = 0;
    let totalMarks = 0;
    const processedAnswers = [];

    const answerMap = {};
    if (answers && Array.isArray(answers)) {
      answers.forEach(ans => {
        answerMap[ans.question] = ans;
      });
    }

    test.questions.forEach(question => {
      totalMarks += question.marks;

      const userAnswer = answerMap[question._id.toString()];
      let selectedAnswer = null;
      let isCorrect = false;
      let qTimeTaken = 0;

      if (userAnswer) {
        selectedAnswer = userAnswer.selectedAnswer;
        qTimeTaken = userAnswer.timeTaken || 0;

        if (selectedAnswer !== null && selectedAnswer !== undefined) {
          if (selectedAnswer === question.correctAnswer) {
            isCorrect = true;
            obtainedMarks += question.marks;
          } else {
            if (test.negativeMarking) {
              const penalty = test.negativeMarkValue || question.negativeMark || 0;
              obtainedMarks -= penalty;
            }
          }
        }
      }

      processedAnswers.push({
        question: question._id,
        selectedAnswer,
        isCorrect,
        timeTaken: qTimeTaken,
      });
    });

    if (obtainedMarks < 0) obtainedMarks = 0;

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    const passed = obtainedMarks >= (test.passingMarks || 0);

    const result = await Result.create({
      user: req.user._id,
      test: testId,
      answers: processedAnswers,
      totalMarks,
      obtainedMarks,
      percentage,
      passed,
      timeTaken: timeTaken || 0,
      autoSubmitted: autoSubmitted || false,
    });

    const user = await User.findById(req.user._id);
    if (user) {
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
      }
    }

    await updateLeaderboard(req.user._id);

    return successResponse(res, 201, 'Test submitted successfully', result);
  } catch (error) {
    console.error('Submit test error:', error.message);
    return errorResponse(res, 500, 'Server error submitting test');
  }
};

module.exports = {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  startTest,
  submitTest,
};

