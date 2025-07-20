const BiddingRoom = require('../models/biddingRoomModel.js');
const { createAndEmitNewBidNotification } = require('../services/notificationService.js');
const Notification = require('../models/notificationModel.js');

// --- PUBLIC: GET ALL BIDDING ROOMS (with Search and Pagination) ---
exports.getAllPublicBiddingRooms = async (req, res) => {
    try {
        // 1. Get page, limit, and search term from query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        // 2. Build the filter object based on the search query
        const searchQuery = req.query.search
            ? {
                name: {
                    $regex: req.query.search, // Use regex for "contains" matching
                    $options: 'i'             // 'i' for case-insensitive
                }
            }
            : {};

        // Combine the search filter with the requirement that rooms must be 'active'
        const filter = { ...searchQuery, status: 'active' };

        // 3. Get the total count of documents that match the filter for pagination
        const totalProducts = await BiddingRoom.countDocuments(filter);

        // 4. Fetch only the specific page of products that match the filter
        const rooms = await BiddingRoom.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('seller', 'firstName lastName');

        // 5. Send the response with products and pagination data
        res.status(200).json({
            products: rooms,
            page: page,
            totalPages: Math.ceil(totalProducts / limit),
        });

    } catch (error) {
        console.error("Error fetching public products:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


// --- PUBLIC: GET A SINGLE BIDDING ROOM ---
exports.getBiddingRoomById = async (req, res) => {
    try {
        const room = await BiddingRoom.findById(req.params.id)
            .populate('seller', 'firstName lastName')
            .populate('bids.bidder', 'firstName lastName');
        if (!room) return res.status(404).json({ message: "Bidding room not found" });
        res.status(200).json(room);
    } catch (error) { res.status(500).json({ message: "Server Error" }) }
};


// --- USER-LEVEL: CREATE A NEW BIDDING ROOM ---
exports.createBiddingRoom = async (req, res) => {
    try {
        const { name, description, startingPrice, endTime } = req.body;
        if (!name || !description || !startingPrice || !endTime || !req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Please provide all required fields and at least one image." });
        }
        const imageUrls = req.files.map(file => `/${file.path.replace(/\\/g, "/")}`);
        const newRoom = new BiddingRoom({
            name, description, startingPrice, endTime, imageUrls,
            seller: req.user.id
        });
        const createdRoom = await newRoom.save();
        res.status(201).json(createdRoom);
    } catch (error) {
        console.error("CREATE ROOM ERROR:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// --- USER-LEVEL: PLACE A BID ---
exports.placeBid = async (req, res) => {
    try {
        const { amount } = req.body;
        const bidder = req.user;
        const bidAmount = parseFloat(amount);

        const room = await BiddingRoom.findById(req.params.id).populate('seller', '_id');
        if (!room) return res.status(404).json({ message: "Bidding room not found." });
        if (new Date() > new Date(room.endTime)) return res.status(400).json({ message: "This auction has already ended." });
        if (bidAmount <= room.currentPrice) return res.status(400).json({ message: `Bid must be higher than $${room.currentPrice}.` });
        if (bidder.id === room.seller._id.toString()) return res.status(400).json({ message: "You cannot bid on your own item." });
        if (bidder.wallet < bidAmount) return res.status(400).json({ message: `Insufficient funds.` });

        const newBid = { bidder: bidder.id, amount: bidAmount, timestamp: new Date() };
        room.bids.unshift(newBid);
        room.currentPrice = newBid.amount;
        await room.save();
        
        const io = req.app.get('socketio');
        createAndEmitNewBidNotification(io, room, bidder);
        
        res.status(201).json({ message: "Bid placed successfully!", room });
    } catch (error) {
        console.error("PLACE BID ERROR:", error);
        res.status(500).json({ message: "Server Error" });
    }
};