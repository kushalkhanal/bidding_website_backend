const express = require('express');
const router = express.Router();
const { productImagesUpload } = require('../../middlewares/uploadMiddleware.js');

const {
    getAllBiddingRooms,
    createBiddingRoom,
    updateBiddingRoomById,
    deleteBiddingRoomById
} = require('../../controllers/admin/biddingRoomManagement.js');

router.get('/', getAllBiddingRooms);
router.put('/:id', updateBiddingRoomById);
router.delete('/:id', deleteBiddingRoomById);
router.post('/', productImagesUpload, createBiddingRoom);

module.exports = router;