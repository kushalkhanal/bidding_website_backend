const BiddingRoom = require('../../models/biddingRoomModel.js');

exports.getAllBiddingRooms = async (req, res) => {
    try {
        const rooms = await BiddingRoom.find({})
            // This populate will now return 'null' for the seller if the user ID is not found
            .populate({
                path: 'seller',
                select: 'username email' // Select which fields from the seller to include
            });

        // This is a safety filter to prevent rooms with deleted sellers from crashing the app.
        const validRooms = rooms.filter(room => room.seller);

        res.status(200).json(validRooms);
    } catch (error) {
        console.error("Error fetching bidding rooms:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
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
            name,
            description,
            startingPrice,
            imageUrls,
            endTime,
            seller: req.user.id
        });

        const createdRoom = await newRoom.save();
        res.status(201).json(createdRoom);
    } catch (error) {
        console.error("Error creating bidding room:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


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