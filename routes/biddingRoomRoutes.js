// File: backend/routes/biddingRoutes.js
// This file defines all public-facing and user-level routes for bidding.

const express = require('express');
const router = express.Router();

// Import all functions from our unified controller
const { 
    getAllPublicBiddingRooms, // <-- The function for your main Auctions page
    getBiddingRoomById,
    placeBid
} = require('../controllers/biddingController.js');

// Import the 'protect' middleware for actions that require a user to be logged in
const { protect } = require('../middlewares/authMiddleware.js');

// --- PUBLIC ROUTES (anyone can access) ---
// GET /api/bidding-rooms/
router.get('/', getAllPublicBiddingRooms);

// GET /api/bidding-rooms/:id
router.get('/:id', getBiddingRoomById);

// --- PRIVATE ROUTE (requires login, but not admin) ---
// POST /api/bidding-rooms/:id/bids
router.post('/:id/bids', protect, placeBid);

module.exports = router;