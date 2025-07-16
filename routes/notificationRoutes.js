

const express = require('express');
const router = express.Router();
const { getMyNotifications, markNotificationsAsRead } = require('../controllers/notificationController.js');
const { protect } = require('../middlewares/authMiddleware.js');

// All routes in this file are protected and require a user to be logged in.
router.use(protect);

// Defines the route: GET /api/notifications
router.get('/', getMyNotifications);

// Defines the route: PUT /api/notifications/mark-read
router.put('/mark-read', markNotificationsAsRead);

module.exports = router;