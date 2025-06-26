
const express = require('express');
const router = express.Router();

// --- Corrected import path to match your controller filename ---
const { 
    getActiveBiddingRooms,
    getBiddingRoomById,
    placeBid
} = require('../controllers/biddingController.js');
// -----------------------------------------------------------

const { protect } = require('../middlewares/authMiddleware.js');

// --- PUBLIC ROUTES ---

// GET /api/bidding-rooms - Get all active rooms
router.get('/', getActiveBiddingRooms);

// GET /api/bidding-rooms/:id - Get a single room
router.get('/:id', getBiddingRoomById);

// --- PRIVATE ROUTE (requires login) ---

// POST /api/bidding-rooms/:id/bids - Place a new bid
router.post('/:id/bids', protect, placeBid);

module.exports = router;