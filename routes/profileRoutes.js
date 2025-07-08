const express = require('express');
const router = express.Router();
const { getMyProfileData, updateMyProfile } = require('../controllers/profileController.js');
const { protect } = require('../middlewares/authMiddleware.js');
const upload = require('../middlewares/uploadMiddleware.js');

// All routes in this file require a user to be logged in
router.use(protect);

// GET /api/profile - Fetches all data for the profile page
router.get('/', getMyProfileData);

// PUT /api/profile - Updates user settings, handles image upload
router.put('/', upload, updateMyProfile);

module.exports = router;