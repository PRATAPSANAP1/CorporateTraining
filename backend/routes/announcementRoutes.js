const express = require('express');
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const router = express.Router();

router.use(auth);

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Announcements retrieved successfully', announcements);
  } catch (error) {
    console.error('Get announcements error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving announcements');
  }
});

// Create a new announcement (admin only)
router.post('/', admin, async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return errorResponse(res, 400, 'Title and message are required');
    }

    const announcement = await Announcement.create({
      title,
      message,
      type: type || 'info',
      createdBy: req.user._id,
    });

    return successResponse(res, 201, 'Announcement created successfully', announcement);
  } catch (error) {
    console.error('Create announcement error:', error.message);
    return errorResponse(res, 500, 'Server error creating announcement');
  }
});

// Delete an announcement (admin only)
router.delete('/:id', admin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return errorResponse(res, 404, 'Announcement not found');
    }

    return successResponse(res, 200, 'Announcement deleted successfully');
  } catch (error) {
    console.error('Delete announcement error:', error.message);
    return errorResponse(res, 500, 'Server error deleting announcement');
  }
});

module.exports = router;
