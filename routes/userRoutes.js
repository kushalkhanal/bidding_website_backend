
const express = require('express');
const router = express.Router();
const { getMyBidHistory } = require('../controllers/userController.js');
const { protect } = require('../middlewares/authMiddleware.js');


router.get('/my-bids', protect, getMyBidHistory);

module.exports = router;