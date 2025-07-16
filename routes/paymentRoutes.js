
const express = require('express');
const router = express.Router();


const { 
    initiateEsewaPayment,
    verifyEsewaPayment,
    getTransactionHistory // <-- This was missing
} = require('../controllers/paymentController.js');


const { protect } = require('../middlewares/authMiddleware.js');

router.post("/initiate", protect, initiateEsewaPayment);


router.get("/history", protect, getTransactionHistory);


router.get("/verify", verifyEsewaPayment);

module.exports = router;