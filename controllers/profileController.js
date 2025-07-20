
const User = require('../models/userModel.js');
const BiddingRoom = require('../models/biddingRoomModel.js');
const jwt = require('jsonwebtoken');


const generateToken = (id, firstName, role) => {
    return jwt.sign({ userId: id, firstName, role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

exports.getMyProfileData = async (req, res) => {
    try {
        const userId = req.user.id;
        // console.log(`Fetching profile data for user ID: ${userId}`);

        const [
            userProfile,
            listedItems,
            roomsBiddedOn
        ] = await Promise.all([
            User.findById(userId).select('-password').lean(),
            BiddingRoom.find({ seller: userId }).sort({ createdAt: -1 }).lean(),
            BiddingRoom.find({ 'bids.bidder': userId }).populate('seller', 'firstName lastName').sort({ updatedAt: -1 }).lean()
        ]);

        if (!userProfile) {
            // console.log(`User profile not found for ID: ${userId}`);
            return res.status(404).json({ message: 'User profile not found.' });
        }

        const now = new Date();
        const winningBids = [];
        const activeOrOutbid = [];


        for (const room of roomsBiddedOn) {
            if (room.bids && room.bids.length > 0) {
                const userBidsOnThisRoom = room.bids.filter(bid => bid.bidder && bid.bidder.toString() === userId);

                if (userBidsOnThisRoom.length > 0) {
                    const userHighestBid = userBidsOnThisRoom.reduce((max, bid) => (bid.amount > max.amount ? bid : max));

                    const isAuctionOver = now > new Date(room.endTime);
                    const isUserTheWinner = room.currentPrice === userHighestBid.amount;

                    if (isAuctionOver && isUserTheWinner) {
                        winningBids.push(room);
                    } else {
                        activeOrOutbid.push(room);
                    }
                }
            }
        }
        // console.log("Successfully fetched all profile data.");
        res.status(200).json({
            profile: userProfile,
            listedItems,
            bidHistory: { winning: winningBids, activeOrOutbid },
        });

    } catch (error) {

        console.error("CRITICAL ERROR in getMyProfileData:", error);
        res.status(500).json({ message: "Server Error while fetching profile data." });

    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.body.number && req.body.number !== user.number) {
            const existingUser = await User.findOne({ number: req.body.number });
            // If a user exists with that number AND it's not the current user, throw an error.
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'This phone number is already in use by another account.' });
            }
            user.number = req.body.number;
        }

        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.location = req.body.location || user.location;


        if (req.file) {
            user.profileImage = `/${req.file.path.replace(/\\/g, "/")}`;
        }

        const updatedUser = await user.save();

        const token = jwt.sign(
            { userId: updatedUser._id, firstName: updatedUser.firstName, role: updatedUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                number: updatedUser.number,
                role: updatedUser.role,
                wallet: updatedUser.wallet,
                profileImage: updatedUser.profileImage,
                location: updatedUser.location,
            },
            token: token
        });

    } catch (error) {
        // console.error("Profile update server error:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error during profile update.' });
    }
};
exports.getMyListedItems = async (req, res) => {
    const listedItems = await BiddingRoom.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json(listedItems);
};