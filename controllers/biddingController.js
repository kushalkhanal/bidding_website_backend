const BiddingRoom = require('../models/biddingRoomModel.js');


exports.getAllPublicBiddingRooms = async (req, res) => {
    try {
        const rooms = await BiddingRoom.find({ status: 'active' })
            .sort({ createdAt: -1 }) // Show newest first
            .populate('seller', 'username');
        res.status(200).json(rooms);
    } catch (error) {
        console.error("Error fetching all public rooms:", error);
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

exports.placeBid = async (req, res) => {
    const { amount } = req.body;
    const bidderId = req.user.id;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Please enter a valid, positive bid amount." });
    }
    try {
        const room = await BiddingRoom.findById(req.params.id);
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