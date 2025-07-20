
const express = require('express');
const router = express.Router();
const { getMyNotifications, markNotificationsAsRead } = require('../controllers/notificationController.js');
const { protect } = require('../middlewares/authMiddleware.js');


router.use(protect);


router.get('/', getMyNotifications);


router.put('/read', markNotificationsAsRead);

module.exports = router;