const crypto = require('crypto'); // Node.js's built-in module for creating secure signatures
const User = require('../models/userModel.js');

exports.initiateEsewaPayment = async (req, res) => {
  
    const { amount } = req.body;
    const userId = req.user.id; 

    // Basic check to ensure the amount is valid.
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Please provide a valid amount.' });
    }

    // --- Prepare data for eSewa ---
    const total_amount = amount;
    const transaction_uuid = `BIDSITE-${Date.now()}-${userId}`; // A unique ID for this transaction
    const product_code = process.env.ESEWA_MERCHANT_CODE;

    const success_url = "http://localhost:5173/payment/success";
    const failure_url = "http://localhost:5173/payment/failure";

   
    const signatureString = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

    const hmac = crypto.createHmac('sha256', process.env.ESEWA_MERCHANT_SECRET);
    hmac.update(signatureString);
    const signature = hmac.digest('base64'); 

    const formData = {
        amount: total_amount,
        failure_url,
        product_delivery_charge: "0",
        product_service_charge: "0",
        product_code,
        signature,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        success_url,
        tax_amount: "0",
        total_amount,
        transaction_uuid,
    };

    res.json({ 
        message: "Initiation successful", 
        formData: formData, 
        esewaUrl: process.env.ESEWA_API_URL 
    });
};