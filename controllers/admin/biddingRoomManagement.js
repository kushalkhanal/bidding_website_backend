

const BiddingRoom = require('../../models/biddingRoomModel');

// @desc    Get all bidding rooms for the admin panel
exports.getAllBiddingRooms = async (req, res) => {
    try {
        const rooms = await BiddingRoom.find({}).populate('seller', 'username email');
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// @desc    Delete a bidding room by ID
exports.deleteBiddingRoomById = async (req, res) => {
    try {
        const room = await BiddingRoom.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Bidding room not found" });
        }
        await room.deleteOne();
        res.status(200).json({ message: "Bidding room deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};