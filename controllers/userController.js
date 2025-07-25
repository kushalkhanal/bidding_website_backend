const User = require("../models/userModel.js");
const BiddingRoom = require('../models/biddingRoomModel.js');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendPasswordResetOTP } = require('../services/emailService');
const otpGenerator = require('otp-generator');


exports.registerUser = async (req, res) => {
    const { email, firstName, lastName, password, number } = req.body;

    if (!email || !firstName || !lastName || !password || !number) {
        return res.status(400).json({
            success: false,
            message: "Please fill all the fields"
        });
    }

    try {
        // Check for existing email or number
        const existingUser = await User.findOne({
            $or: [{ email }, { number }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email or phone number already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            firstName,
            lastName,
            password: hashedPassword,
            number
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully"
        });

    } catch (e) {
        console.error("Error in registerUser:", e);
        // Provide a more specific error message if it's a validation error
        if (e.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: e.message });
        }
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
            return res.status(404).json({
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

        // 5. The JWT payload no longer contains 'username'
        const token = jwt.sign(
            {
                userId: user._id,
                firstName: user.firstName, // Use firstName for display purposes
                role: user.role
            },
            process.env.JWT_SECRET, { expiresIn: "7d" }
        );

        // 6. The returned user object no longer contains 'username'
        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                number: user.number,
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
        const userId = req.user.id;
        const roomsBiddedOn = await BiddingRoom.find({ 'bids.bidder': userId })
            .populate('seller', 'firstName lastName')
            .sort({ updatedAt: -1 });

        const now = new Date();
        const bidHistory = { winning: [], activeOrOutbid: [] };

        for (const room of roomsBiddedOn) {
            if (room.bids && room.bids.length > 0) {
                const userBidsOnThisRoom = room.bids.filter(bid => bid.bidder && bid.bidder.toString() === userId);
                if (userBidsOnThisRoom.length > 0) {
                    const userHighestBid = userBidsOnThisRoom.reduce((max, bid) => (bid.amount > max.amount ? bid : max));
                    const isAuctionOver = now > new Date(room.endTime);
                    const isUserTheWinner = room.currentPrice === userHighestBid.amount;
                    if (isAuctionOver && isUserTheWinner) {
                        bidHistory.winning.push(room);
                    } else {
                        bidHistory.activeOrOutbid.push(room);
                    }
                }
            }
        }
        res.status(200).json(bidHistory);
    } catch (error) {
        console.error("Error fetching bid history:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    try {
        const user = await User.findOne({ email });

        // To prevent email enumeration, always return a generic success message.
        if (!user) {
            return res.status(200).json({ success: true, message: 'If an account with that email exists, an OTP has been sent.' });
        }

        // Generate a 6-digit OTP
        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        // Set OTP and expiration on the user document (e.g., 10 minutes)
        user.passwordResetOTP = otp;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes in ms
        await user.save();

        // Send the OTP via email
        await sendPasswordResetOTP(user.email, otp);

        res.status(200).json({ success: true, message: 'If an account with that email exists, an OTP has been sent.' });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: 'Server error while processing request.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { otp, email, newPassword } = req.body;

    if (!otp || !email || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please provide OTP, email, and a new password.' });
    }

    try {
        // Find the user by email, ensuring the OTP is correct and not expired
        const user = await User.findOne({
            email: email,
            passwordResetOTP: otp,
            passwordResetExpires: { $gt: Date.now() } // Check if the expiration is in the future
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'OTP is invalid or has expired. Please try again.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Clear the OTP fields to prevent reuse
        user.passwordResetOTP = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: 'Server error while resetting password.' });
    }
};