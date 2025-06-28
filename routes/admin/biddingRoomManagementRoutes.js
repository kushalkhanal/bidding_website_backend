
const express = require('express');
const router = express.Router();

const {
    getAllBiddingRooms,
    createBiddingRoom,
    updateBiddingRoomById,
    deleteBiddingRoomById
} = require('../../controllers/admin/biddingRoomManagement.js');


router.route('/')
    .get(getAllBiddingRooms)   
    .post(createBiddingRoom);  
router.route('/:id')
    .put(updateBiddingRoomById)
    .delete(deleteBiddingRoomById);

module.exports = router;