
const express = require('express');
const router = express.Router();


const {
    initiateEsewaPayment,
    verifyEsewaPayment,
    getTransactionHistory,
    confirmFrontendPayment,
} = require('../controllers/paymentController.js');



const { protect } = require('../middlewares/authMiddleware.js');

router.post("/initiate", protect, initiateEsewaPayment);


router.get("/history", protect, getTransactionHistory);

router.get("/verify", verifyEsewaPayment);

router.post("/confirm-from-frontend", protect, confirmFrontendPayment);
module.exports = router;