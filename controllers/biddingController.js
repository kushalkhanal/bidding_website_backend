const BiddingRoom = require('../models/biddingRoomModel.js');

exports.getAllPublicBiddingRooms = async (req, res) => {
    try {
        // 1. Get page and limit from query parameters, with default values
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8; // e.g., 8 items per page
        const skip = (page - 1) * limit; // Calculate how many items to skip

        const totalProducts = await BiddingRoom.countDocuments({ status: 'active' });

        const rooms = await BiddingRoom.find({ status: 'active' })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('seller', 'username');

        res.status(200).json({
            products: rooms,
            page: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts: totalProducts
        });

    } catch (error) {
        console.error("Error fetching public products:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

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




exports.createBiddingRoom = async (req, res) => {
    const { name, description, startingPrice, endTime } = req.body;
    if (!name || !description || !startingPrice || !endTime || !req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Please provide all required fields and at least one image." });
    }
    try {
        const imageUrls = req.files.map(file => `/${file.path.replace(/\\/g, "/")}`);
        const newRoom = new BiddingRoom({
            name, description, startingPrice, endTime, imageUrls,
            seller: req.user.id // From 'protect' middleware
        });
        const createdRoom = await newRoom.save();
        res.status(201).json(createdRoom);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

exports.placeBid = async (req, res) => {
    const { amount } = req.body;
    const bidderId = req.user.id;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Please enter a valid, positive bid amount." });
    }
    try {
        const room = await BiddingRoom.findById(req.params.id);
        const bidAmount = parseFloat(amount);
        if (!room) return res.status(404).json({ message: "Bidding room not found." });
        if (new Date() > room.endTime) return res.status(400).json({ message: "This auction has already ended." });
        if (parseFloat(amount) <= room.currentPrice) return res.status(400).json({ message: `Your bid must be higher than the current price of $${room.currentPrice}.` });
        if (bidderId === room.seller.toString()) return res.status(400).json({ message: "You cannot bid on your own item." });
        if (req.user.wallet < bidAmount) {
            return res.status(400).json({
                message: `Insufficient funds. Your current balance is $${req.user.wallet}, but your bid is $${bidAmount}.`
            });
        }
        const newBid = { bidder: bidderId, amount: parseFloat(amount), timestamp: new Date() };
        room.bids.unshift(newBid);
        room.currentPrice = newBid.amount;
        await room.save();
        res.status(201).json({ message: "Bid placed successfully!", room });
    } catch (error) {
        console.error("Error placing bid:", error);
        res.status(500).json({ message: "Server Error" });
    }
};