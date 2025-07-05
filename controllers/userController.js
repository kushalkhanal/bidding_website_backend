const User = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const BiddingRoom = require('../models/biddingRoomModel.js');



exports.registerUser = async (req, res) => {
    console.log("Hitting register user");

    const { username, email, firstName, lastName, password } = req.body;

    if (!username || !email || !firstName || !lastName || !password) {
        return res.status(400).json({ // Changed to 400 for Bad Request
            success: false,
            message: "Please fill all the fields"
        });
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({ // Changed to 409 for Conflict
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            firstName,
            lastName,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully"
        });

    } catch (e) {
        console.error("Error in registerUser:", e);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            "success": false,
            "message": "Email and password are required"
        });
    }

    try {
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ // Changed to 404 for Not Found
                "success": false,
                "message": "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                "success": false,
                "message": "Invalid credentials"
            });
        }


        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET, { expiresIn: "7d" }
        );


        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                wallet: user.wallet
            },
        });


    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getMyBidHistory = async (req, res) => {
    try {

        const roomsBiddedOn = await BiddingRoom.find({ 'bids.bidder': req.user.id })
            .populate('seller', 'username')
            .sort({ updatedAt: -1 });

        const now = new Date();
        const bidHistory = {
            winning: [],
            activeOrOutbid: []
        };
        for (const room of roomsBiddedOn) {
            const userHighestBid = room.bids
                .filter(bid => bid.bidder.toString() === req.user.id)
                .reduce((max, bid) => (bid.amount > max.amount ? bid : max));

            const isAuctionOver = now > new Date(room.endTime);
            const isUserTheWinner = room.currentPrice === userHighestBid.amount;

            if (isAuctionOver && isUserTheWinner) {
                bidHistory.winning.push(room);
            } else {
                bidHistory.activeOrOutbid.push(room);
            }
        }

        res.status(200).json(bidHistory);

    } catch (error) {
        console.error("Error fetching bid history:", error);
        res.status(500).json({ message: "Server Error" });
    }
};