

const User = require('../../models/userModel');
const BiddingRoom = require('../../models/biddingRoomModel');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBiddingRooms = await BiddingRoom.countDocuments();
        res.status(200).json({
            totalUsers,
            totalBiddingRooms
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};