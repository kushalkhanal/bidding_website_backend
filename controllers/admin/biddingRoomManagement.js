
const BiddingRoom = require('../../models/biddingRoomModel.js');

// === READ: Get all bidding rooms ===
exports.getAllBiddingRooms = async (req, res) => {
    try {
        const rooms = await BiddingRoom.find({}).populate('seller', 'username email');
        res.status(200).json(rooms);
    } catch (error) {
        console.error("Error fetching bidding rooms:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// === CREATE: Add a new bidding room ===
exports.createBiddingRoom = async (req, res) => {
    const { name, description, startingPrice, imageUrl, endTime } = req.body;

    if (!name || !description || !startingPrice || !imageUrl || !endTime) {
        return res.status(400).json({ message: "Please provide all required fields." });
    }

    try {
        const newRoom = new BiddingRoom({
            name,
            description,
            startingPrice,
            imageUrl,
            endTime,
            seller: req.user.id // Assumes 'protect' middleware has run and attached the user
        });

        const createdRoom = await newRoom.save();
        res.status(201).json(createdRoom);
    } catch (error) {
        console.error("Error creating bidding room:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// === UPDATE: Modify an existing bidding room ===
exports.updateBiddingRoomById = async (req, res) => {
    try {
        const room = await BiddingRoom.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: "Bidding room not found" });
        }
        
        room.name = req.body.name || room.name;
        room.description = req.body.description || room.description;
        room.endTime = req.body.endTime || room.endTime;

       
        if (typeof req.body.startingPrice === 'number') {
            room.startingPrice = req.body.startingPrice;
        }
        if (typeof req.body.currentPrice === 'number') {
            room.currentPrice = req.body.currentPrice;
        }

        const updatedRoom = await room.save();
        res.status(200).json(updatedRoom);

    } catch (error) {
        console.error("Error updating bidding room:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// === DELETE: Remove a bidding room ===
exports.deleteBiddingRoomById = async (req, res) => {
    try {
        const room = await BiddingRoom.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Bidding room not found" });
        }
        await room.deleteOne();
        res.status(200).json({ message: "Bidding room deleted successfully" });
    } catch (error) {
        console.error("Error deleting bidding room:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};