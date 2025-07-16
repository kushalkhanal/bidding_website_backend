

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/paymentModel.js'); // Your corrected model
const User = require('../models/userModel.js');


exports.initiateEsewaPayment = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user._id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Please provide a valid amount.' });
        }

        const transaction_uuid = uuidv4();
        
   
        const newPayment = new Payment({ userId, amount, transaction_uuid, status: 'pending' });
        await newPayment.save();

        const message = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${process.env.ESEWA_MERCHANT_CODE}`;
        const hmac = crypto.createHmac('sha256', process.env.ESEWA_MERCHANT_SECRET);
        hmac.update(message);
        const signature = hmac.digest('base64');

        const formData = {
            amount: amount.toString(),
            failure_url: "http://localhost:5173/payment/failure",
            product_delivery_charge: "0",
            product_service_charge: "0",
            product_code: process.env.ESEWA_MERCHANT_CODE,
            signature,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            success_url: `http://localhost:5050/api/payment/verify`, // eSewa server calls this backend URL
            tax_amount: "0",
            total_amount: amount.toString(),
            transaction_uuid,
        };
        
        res.status(200).json({ success: true, data: formData, esewaUrl: process.env.ESEWA_API_URL });
    
    } catch (error) {
        console.error("eSewa initiation error:", error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};


exports.verifyEsewaPayment = async (req, res) => {
    const successRedirectUrl = "http://localhost:5173/payment/success";
    const failureRedirectUrl = "http://localhost:5173/payment/failure";

    try {
        const { data } = req.query;
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        
        if (decodedData.status !== "COMPLETE") {
            return res.redirect(failureRedirectUrl);
        }

        // --- Server-to-server verification for security ---
        const verificationUrl = `https://uat.esewa.com.np/api/epay/transaction/status/?product_code=${process.env.ESEWA_MERCHANT_CODE}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;
        const response = await fetch(verificationUrl); // Requires node-fetch or built-in fetch in Node 18+
        const verificationResponse = await response.json();

        if (verificationResponse.status !== 'COMPLETE') {
            return res.redirect(failureRedirectUrl);
        }
        // --- End verification ---

        const payment = await Payment.findOne({ transaction_uuid: decodedData.transaction_uuid });
        if (!payment || payment.status === 'success') {
            return res.redirect(successRedirectUrl);
        }

        payment.status = 'success';
        await payment.save();

        // This is the crucial step: Add the amount to the user's wallet
        await User.findByIdAndUpdate(payment.userId, { $inc: { wallet: payment.amount } });
        
        res.redirect(successRedirectUrl);

    } catch (error) {
        console.error("Error in eSewa verification:", error);
        res.redirect(failureRedirectUrl);
    }
};

exports.getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const payments = await Payment.find({ userId, status: 'success' }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: payments });
    } catch (error) {
        console.error("Get transaction history error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};