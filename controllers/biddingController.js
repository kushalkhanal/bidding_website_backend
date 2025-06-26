
const BiddingRoom = require('../models/biddingRoomModel.js');

// === GET ALL ACTIVE ROOMS (for the public listing page) ===
// @desc    Fetch all active bidding rooms
// @route   GET /api/bidding-rooms
// @access  Public
exports.getActiveBiddingRooms = async (req, res) => {
    try {
        const rooms = await BiddingRoom.find({ 
            status: 'active',
            endTime: { $gt: new Date() } 
        }).populate('seller', 'username').sort({ createdAt: -1 });

        res.status(200).json(rooms);
    } catch (error) {
        console.error("Error fetching active rooms:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// === GET A SINGLE ROOM (for the product detail page) ===
// @desc    Fetch a single bidding room by its ID
// @route   GET /api/bidding-rooms/:id
// @access  Public
exports.getBiddingRoomById = async (req, res) => {
    try {
        const room = await BiddingRoom.findById(req.params.id)
            .populate('seller', 'username')
            .populate('bids.bidder', 'username');

        if (!room) {
            return res.status(404).json({ message: "Bidding room not found" });
        }

        res.status(200).json(room);
    } catch (error) {
        console.error("Error fetching single room:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// === PLACE A BID (the core bidding logic) ===
// @desc    Place a new bid on a room
// @route   POST /api/bidding-rooms/:id/bids
// @access  Private (requires login)
exports.placeBid = async (req, res) => {
    const { amount } = req.body;
    const bidderId = req.user.id;

    if (!amount || isNaN(amount)) {
        return res.status(400).json({ message: "Please enter a valid bid amount." });
    }
    
    try {
        const room = await BiddingRoom.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: "Bidding room not found." });
        }

        if (new Date() > room.endTime) {
            return res.status(400).json({ message: "This auction has already ended." });
        }

        if (parseFloat(amount) <= room.currentPrice) {
            return res.status(400).json({ message: `Your bid must be higher than the current price of $${room.currentPrice}.` });
        }

        if (bidderId === room.seller.toString()) {
            return res.status(400).json({ message: "You cannot bid on your own item." });
        }

        const newBid = {
            bidder: bidderId,
            amount: parseFloat(amount),
            timestamp: new Date()
        };

        room.bids.unshift(newBid);
        room.currentPrice = newBid.amount;
        
        await room.save();

        res.status(201).json({ message: "Bid placed successfully!", room });

    } catch (error) {
        console.error("Error placing bid:", error);
        res.status(500).json({ message: "Server Error" });
    }
};