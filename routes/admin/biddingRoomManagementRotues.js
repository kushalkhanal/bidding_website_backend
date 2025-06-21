
const express = require('express');
const router = express.Router();
const { getAllBiddingRooms, deleteBiddingRoomById } = require('../../controllers/admin/biddingRoomManagement.controller');

// GET /api/admin/bidding-rooms
router.get('/', getAllBiddingRooms);

// DELETE /api/admin/bidding-rooms/:id
router.delete('/:id', deleteBiddingRoomById);

module.exports = router;