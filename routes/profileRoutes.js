const express = require('express');
const router = express.Router();
const { getMyProfileData, updateMyProfile, getMyListedItems } = require('../controllers/profileController.js');
const { protect } = require('../middlewares/authMiddleware.js');
const { profileImageUpload } = require('../middlewares/uploadMiddleware.js');


router.use(protect);

// GET /api/profile - Fetches all data for the profile page
router.get('/', getMyProfileData);

// PUT /api/profile - Updates user settings, handles image upload
router.put('/', profileImageUpload, updateMyProfile);

router.get('/listed-items', getMyListedItems);
module.exports = router;