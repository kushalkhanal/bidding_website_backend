const express = require('express');
const router = express.Router();

const {
    createBiddingRoom,
    updateBiddingRoomById,
    deleteBiddingRoomById
} = require('../../controllers/admin/biddingRoomManagement.js');

router.post('/', createBiddingRoom);
router.put('/:id', updateBiddingRoomById);
router.delete('/:id', deleteBiddingRoomById);

module.exports = router;