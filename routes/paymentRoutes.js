const express = require('express');
const router = express.Router();

const { initiateEsewaPayment } = require('../controllers/paymentController.js');

const { protect } = require('../middlewares/authMiddleware.js');

// This creates the endpoint: POST /api/payment/esewa/initiate

router.post('/esewa/initiate', protect, initiateEsewaPayment);

module.exports = router;