
const Notification = require('../models/notificationModel.js');

const createAndEmitNewBidNotification = async (io, room, newBidder) => {
    try {
        const notificationLink = `/products/${room._id}`;
        const newBidderIdString = newBidder._id.toString();

        // 1. Notify the Seller
        const sellerIdString = room.seller._id.toString(); // Get the ID string from the populated object
        if (sellerIdString !== newBidderIdString) {
            const sellerNotification = new Notification({
                // --- FIX 1: Pass the ID string, not the whole object ---
                user: sellerIdString,
                // ----------------------------------------------------
                message: `A new bid of $${room.currentPrice} was placed on your item: '${room.name}'.`,
                link: notificationLink
            });
            await sellerNotification.save();
            io.to(sellerIdString).emit('new_notification', sellerNotification);
        }

        // 2. Notify the person who was just outbid
        if (room.bids.length > 1) {
            // It's safer to get the ID directly from the object if it's populated
            const previousTopBidderIdString = room.bids[1].bidder._id 
                ? room.bids[1].bidder._id.toString() 
                : room.bids[1].bidder.toString();

            if (previousTopBidderIdString !== newBidderIdString) {
                const outbidNotification = new Notification({
                    // --- FIX 2: Pass the ID string here as well ---
                    user: previousTopBidderIdString,
                    // --------------------------------------------
                    message: `You have been outbid on '${room.name}'! The new bid is $${room.currentPrice}.`,
                    link: notificationLink
                });
                await outbidNotification.save();
                io.to(previousTopBidderIdString).emit('new_notification', outbidNotification);
            }
        }
    } catch (error) {
        console.error("--- ERROR IN NOTIFICATION SERVICE ---", error);
    }
};

module.exports = {
    createAndEmitNewBidNotification,
};