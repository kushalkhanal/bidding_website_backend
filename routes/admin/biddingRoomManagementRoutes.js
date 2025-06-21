

const express = require('express');
const router = express.Router();


const {
    getAllBiddingRooms,
    deleteBiddingRoomById,
    createBiddingRoom,
    updateBiddingRoomById
} = require('../../controllers/admin/biddingRoomManagement.js');


// Base Route: /api/admin/bidding-rooms


router.get('/', getAllBiddingRooms);


router.post('/', createBiddingRoom);


router.put('/:id', updateBiddingRoomById);


router.delete('/:id', deleteBiddingRoomById);

module.exports = router;