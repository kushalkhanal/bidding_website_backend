// // File: backend/controllers/biddingController.js

// const BiddingRoom = require('../models/biddingRoomModel.js');
// const Notification = require('../models/notificationModel.js');

// // --- PUBLIC: GET ALL BIDDING ROOMS (FOR AUCTIONS PAGE) ---
// exports.getAllPublicBiddingRooms = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 8;
//         const skip = (page - 1) * limit;

//         const totalProducts = await BiddingRoom.countDocuments({ status: 'active' });
//         const rooms = await BiddingRoom.find({ status: 'active' })
//             .sort({ createdAt: -1 })
//             .limit(limit)
//             .skip(skip)
//             .populate('seller', 'firstName lastName');

//         res.status(200).json({
//             products: rooms,
//             page: page,
//             totalPages: Math.ceil(totalProducts / limit),
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Server Error" });
//     }
// };

// // --- PUBLIC: GET A SINGLE BIDDING ROOM (FOR DETAIL PAGE) ---
// exports.getBiddingRoomById = async (req, res) => {
//     try {
//         const room = await BiddingRoom.findById(req.params.id)
//             .populate('seller', 'firstName lastName')
//             .populate('bids.bidder', 'firstName lastName');
//         if (!room) {
//             return res.status(404).json({ message: "Bidding room not found" });
//         }
//         res.status(200).json(room);
//     } catch (error) {
//         res.status(500).json({ message: "Server Error" });
//     }
// };

// // --- USER-LEVEL: CREATE A NEW BIDDING ROOM ---
// exports.createBiddingRoom = async (req, res) => {
//     try {
//         const { name, description, startingPrice, endTime } = req.body;
//         if (!name || !description || !startingPrice || !endTime || !req.files || req.files.length === 0) {
//             return res.status(400).json({ message: "Please provide all required fields and at least one image." });
//         }
//         const imageUrls = req.files.map(file => `/${file.path.replace(/\\/g, "/")}`);
//         const newRoom = new BiddingRoom({
//             name, description, startingPrice, endTime, imageUrls,
//             seller: req.user.id
//         });
//         const createdRoom = await newRoom.save();
//         res.status(201).json(createdRoom);
//     } catch (error) {
//         console.error("CREATE ROOM ERROR:", error);
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };

// // --- USER-LEVEL: PLACE A BID ---
// // This function needs to be exported correctly.
// exports.placeBid = async (req, res) => {
//     try {
//         const { amount } = req.body;
//         const bidder = req.user;
//         const bidAmount = parseFloat(amount);

//         const room = await BiddingRoom.findById(req.params.id).populate('seller', '_id');
//         if (!room) return res.status(404).json({ message: "Bidding room not found." });
//         if (new Date() > new Date(room.endTime)) return res.status(400).json({ message: "This auction has already ended." });
//         if (bidAmount <= room.currentPrice) return res.status(400).json({ message: `Your bid must be higher than the current price of $${room.currentPrice}.` });
//         if (bidder.id === room.seller._id.toString()) return res.status(400).json({ message: "You cannot bid on your own item." });
//         if (bidder.wallet < bidAmount) return res.status(400).json({ message: `Insufficient funds.` });

//         const newBid = { bidder: bidder.id, amount: bidAmount, timestamp: new Date() };
//         room.bids.unshift(newBid);
//         room.currentPrice = newBid.amount;
//         await room.save();
        
//         const io = req.app.get('socketio');
//         const notificationLink = `/products/${room._id}`;

//         const sellerIdString = room.seller._id.toString();
//         if (sellerIdString !== bidder.id) {
//             const sellerNotification = new Notification({ user: sellerIdString, message: `A new bid of $${room.currentPrice} was placed on your item: ${room.name}.`, link: notificationLink });
//             await sellerNotification.save();
//             io.to(sellerIdString).emit('new_notification', sellerNotification);
//         }

//         if (room.bids.length > 1) {
//             const previousTopBidderIdString = room.bids[1].bidder.toString();
//             if (previousTopBidderIdString !== bidder.id) {
//                 const outbidNotification = new Notification({ user: previousTopBidderIdString, message: `You have been outbid on ${room.name}! The new bid is $${room.currentPrice}.`, link: notificationLink });
//                 await outbidNotification.save();
//                 io.to(previousTopBidderIdString).emit('new_notification', outbidNotification);
//             }
//         }
        
//         res.status(201).json({ message: "Bid placed successfully!", room });

//     } catch (error) {
//         console.error("PLACE BID ERROR:", error);
//         res.status(500).json({ message: "Server Error" });
//     }
// };






const BiddingRoom = require('../models/biddingRoomModel.js');
// We ONLY import the service, not the Notification model anymore.
const { createAndEmitNewBidNotification } = require('../services/notificationService.js');

// --- PUBLIC: GET ALL BIDDING ROOMS ---
exports.getAllPublicBiddingRooms = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        const totalProducts = await BiddingRoom.countDocuments({ status: 'active' });
        const rooms = await BiddingRoom.find({ status: 'active' })
            .sort({ createdAt: -1 }).limit(limit).skip(skip)
            .populate('seller', 'firstName lastName');

        res.status(200).json({
            products: rooms,
            page: page,
            totalPages: Math.ceil(totalProducts / limit),
        });
    } catch (error) { res.status(500).json({ message: "Server Error" }) }
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
    // ... (Your existing createBiddingRoom logic is perfect and doesn't need changes) ...
};


exports.placeBid = async (req, res) => {
    try {
        const { amount } = req.body;
        const bidder = req.user;
        const bidAmount = parseFloat(amount);

        // --- Step 1: Find and Validate Room ---
        let room = await BiddingRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ message: "Bidding room not found." });
        if (new Date() > new Date(room.endTime)) return res.status(400).json({ message: "This auction has already ended." });
        if (bidAmount <= room.currentPrice) return res.status(400).json({ message: `Bid must be higher than $${room.currentPrice}.` });
        if (bidder.id === room.seller.toString()) return res.status(400).json({ message: "You cannot bid on your own item." });
        if (bidder.wallet < bidAmount) return res.status(400).json({ message: `Insufficient funds.` });

        // --- Step 2: Update and Save Bid ---
        const newBid = { bidder: bidder.id, amount: bidAmount, timestamp: new Date() };
        room.bids.unshift(newBid);
        room.currentPrice = newBid.amount;
        await room.save();

        // --- Step 3: THIS IS THE FIX - Re-fetch the room to get populated data ---
        // After saving, we fetch the document again to ensure all references
        // in the 'bids' array are properly populated for our notification service.
        const updatedRoomForNotification = await BiddingRoom.findById(room._id).populate('seller', '_id');
        // --------------------------------------------------------------------------
        
        // --- Step 4: Call the Notification Service with Fresh Data ---
        const io = req.app.get('socketio');
        createAndEmitNewBidNotification(io, updatedRoomForNotification, bidder);
        
        // Send the successful response back to the bidder immediately.
        res.status(201).json({ message: "Bid placed successfully!", room });

    } catch (error) {
        console.error("PLACE BID ERROR:", error);
        res.status(500).json({ message: "Server Error" });
    }
};