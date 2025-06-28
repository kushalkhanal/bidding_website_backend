
const express = require('express');
const router = express.Router();


const { 
    getActiveBiddingRooms,
    getBiddingRoomById,
    placeBid
} = require('../controllers/biddingController.js');


const { protect } = require('../middlewares/authMiddleware.js');

// --- PUBLIC ROUTES ---


router.get('/', getActiveBiddingRooms);
router.get('/:id', getBiddingRoomById);

// --- PRIVATE ROUTE (requires login) ---

// POST /api/bidding-rooms/:id/bids - Place a new bid
router.post('/:id/bids', protect, placeBid);

module.exports = router;