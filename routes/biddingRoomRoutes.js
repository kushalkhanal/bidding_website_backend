

const express = require('express');
const router = express.Router();


// We need to import ALL the functions used in this file from the biddingController.
const { 
    getAllPublicBiddingRooms,
    getBiddingRoomById,
    placeBid,
    createBiddingRoom // <-- This was missing from the import
} = require('../controllers/biddingController.js');


const { protect } = require('../middlewares/authMiddleware.js');
const { productImagesUpload } = require('../middlewares/uploadMiddleware.js');

// --- PUBLIC ROUTES (anyone can access) ---
// GET /api/bidding-rooms/
router.get('/', getAllPublicBiddingRooms);

// GET /api/bidding-rooms/:id
router.get('/:id', getBiddingRoomById);




// POST /api/bidding-rooms/ - Creates a new listing for the logged-in user
// This route will now work because 'createBiddingRoom' is correctly imported.
router.post('/', protect, productImagesUpload, createBiddingRoom);


// POST /api/bidding-rooms/:id/bids - Places a new bid
router.post('/:id/bids', protect, placeBid);

module.exports = router;