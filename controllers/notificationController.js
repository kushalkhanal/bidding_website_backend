

const Notification = require('../models/notificationModel.js');

// @desc    Get all notifications for the currently logged-in user
// @route   GET /api/notifications
// @access  Private (requires user to be logged in)
exports.getMyNotifications = async (req, res) => {
    try {
        // Find all notifications where the 'user' field matches the logged-in user's ID
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(30); // Limit to the 30 most recent notifications to keep the payload small

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching user notifications:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/mark-read
// @access  Private
exports.markNotificationsAsRead = async (req, res) => {
    try {
        // Find all unread notifications for the user and update them to be 'isRead: true'
        await Notification.updateMany(
            { user: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.markNotificationsAsRead = async (req, res) => {
    try {
        const filter = { user: req.user.id, isRead: false };
        if (req.body.notificationId) {
            filter._id = req.body.notificationId;
        }

        await Notification.updateMany(filter, { $set: { isRead: true } });

        res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};