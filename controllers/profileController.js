
const User = require('../models/userModel.js');
const BiddingRoom = require('../models/biddingRoomModel.js');


exports.getMyProfileData = async (req, res) => {
    try {
        const userId = req.user.id; // From the 'protect' middleware
        const [
            userProfile,
            listedItems,
            roomsBiddedOn
        ] = await Promise.all([
            User.findById(userId).select('-password'), // Get user data, exclude password
            BiddingRoom.find({ seller: userId }).sort({ createdAt: -1 }), // Get items the user is selling
            BiddingRoom.find({ 'bids.bidder': userId }).populate('seller', 'firstName lastName').sort({ updatedAt: -1 }) // Get rooms the user has bid on
        ]);

        if (!userProfile) {
            return res.status(404).json({ message: 'User profile not found.' });
        }

    
        const now = new Date();
        const winningBids = [];
        const activeOrOutbid = [];

        for (const room of roomsBiddedOn) {
            const userHighestBid = room.bids
                .filter(bid => bid.bidder.toString() === userId)
                .reduce((max, bid) => (bid.amount > max.amount ? bid : max));
            
            const isAuctionOver = now > new Date(room.endTime);
            const isUserTheWinner = room.currentPrice === userHighestBid.amount;

            if (isAuctionOver && isUserTheWinner) {
                winningBids.push(room);
            } else {
                activeOrOutbid.push(room);
            }
        }
    
        res.status(200).json({
            profile: userProfile,
            listedItems,
            bidHistory: { winning: winningBids, activeOrOutbid },
        });

    } catch (error) {
        console.error("Error fetching profile data:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        const { firstName, lastName, number, location } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.number = number || user.number;
        user.location = location || user.location;

        if (req.file) {
            user.profileImage = `/${req.file.path.replace(/\\/g, "/")}`;
        }
        
        await user.save();
        const userResponse = { ...user._doc };
        delete userResponse.password;

        res.json(userResponse);
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};