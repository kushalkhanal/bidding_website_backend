
const express = require('express');
const router = express.Router();
const { getMyBidHistory,getMe } = require('../controllers/userController.js');
const { protect } = require('../middlewares/authMiddleware.js');


router.get('/my-bids', protect, getMyBidHistory);
router.get('/me', protect, getMe);
module.exports = router;