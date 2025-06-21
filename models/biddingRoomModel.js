
const mongoose = require('mongoose');

const biddingRoomSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    startingPrice: { type: Number, required: true, default: 0 },
    currentPrice: { type: Number, required: true, default: 0 },
    imageUrl: { type: String, required: true },
    endTime: { type: Date, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'sold', 'expired'], default: 'active' }
}, { timestamps: true });

// A pre-save hook to ensure the starting price is set as the initial current price
biddingRoomSchema.pre('save', function(next) {
    if (this.isNew) {
        this.currentPrice = this.startingPrice;
    }
    next();
});

module.exports = mongoose.model('BiddingRoom', biddingRoomSchema);