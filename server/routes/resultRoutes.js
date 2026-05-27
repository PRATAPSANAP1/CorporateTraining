const express = require('express');
const {
  getMyResults,
  getResultDetail,
  getAllResults,
  getResultStats,
} = require('../controllers/resultController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.use(auth);

// Student routes
router.get('/my', getMyResults);
router.get('/my/:id', getResultDetail);

// Admin-only routes
router.get('/admin/all', admin, getAllResults);
router.get('/admin/stats/:testId', admin, getResultStats);

module.exports = router;
