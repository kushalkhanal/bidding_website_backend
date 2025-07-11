const express = require('express');
const router = express.Router();

const {
    getAllPublicBiddingRooms, // <-- The function for your main Auctions page
    getBiddingRoomById,
    placeBid,
    createBiddingRoom
} = require('../controllers/biddingController.js');

// Import the 'protect' middleware for actions that require a user to be logged in
const { protect } = require('../middlewares/authMiddleware.js');
const { productImagesUpload } = require('../middlewares/uploadMiddleware.js');


router.post('/', protect, productImagesUpload, createBiddingRoom);

router.get('/', getAllPublicBiddingRooms);

// GET /api/bidding-rooms/:id
router.get('/:id', getBiddingRoomById);

// --- PRIVATE ROUTE (requires login, but not admin) ---
// POST /api/bidding-rooms/:id/bids
router.post('/:id/bids', protect, placeBid);

module.exports = router;