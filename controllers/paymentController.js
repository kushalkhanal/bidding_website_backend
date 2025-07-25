
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); 
const Payment = require('../models/paymentModel.js');
const User = require('../models/userModel.js');

// Destructure environment variables for cleaner code
const {
    ESEWA_MERCHANT_CODE,
    ESEWA_MERCHANT_SECRET,
    ESEWA_API_URL,
    ESEWA_VERIFY_URL,
    FRONTEND_URL
} = process.env;


/**
 * @desc    Initiate a payment with eSewa
 * @route   POST /api/payment/initiate
 * @access  Private
 */
exports.initiateEsewaPayment = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user._id;

        if (!amount || amount < 10) {
            return res.status(400).json({ success: false, message: 'Amount must be at least NPR 10.' });
        }

        const transaction_uuid = uuidv4();
        
        // Step 1: Create a pending payment record in your database.
        const newPayment = new Payment({
            userId,
            amount,
            transaction_uuid,
            status: 'pending',
            paymentType: 'wallet_load'
        });
        await newPayment.save();

        // Step 2: Generate the eSewa signature.
        const message = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_MERCHANT_CODE}`;
        const hmac = crypto.createHmac('sha256', ESEWA_MERCHANT_SECRET);
        hmac.update(message);
        const signature = hmac.digest('base64');

        // Step 3: Prepare the form data for eSewa.
        const formData = {
            amount: amount.toString(),
            tax_amount: "0",
            total_amount: amount.toString(),
            transaction_uuid,
            product_code: ESEWA_MERCHANT_CODE,
            product_service_charge: "0",
            product_delivery_charge: "0",
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature,
        
            success_url: `${FRONTEND_URL}/payment/success`,
            failure_url: `${FRONTEND_URL}/payment/failure`,
        };
        
        // Step 4: Send the form data and the eSewa submission URL to the frontend.
        res.status(200).json({
            success: true,
            data: formData,
            esewaUrl: ESEWA_API_URL
        });
    
    } catch (error) {
        console.error("eSewa initiation error:", error);
        return res.status(500).json({ success: false, message: 'Server Error during payment initiation.' });
    }
};


/**
 * @desc    Verify the payment status with eSewa's server.
 * @route   GET /api/payment/verify
 * @access  Public (Called by eSewa's server)
 */
exports.verifyEsewaPayment = async (req, res) => {
    // Define the redirect URLs for the user's browser at the very end.
    const successRedirectUrl = `${FRONTEND_URL}/payment/success`;
    const failureRedirectUrl = `${FRONTEND_URL}/payment/failure`;

    try {
        const { data } = req.query;
        if (!data) {
            console.error("Verification failed: No data received from eSewa.");
            return res.redirect(failureRedirectUrl + '?error=nodata');
        }

        // Step 1: Decode the base64 data from eSewa.
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        
        // Early exit if the transaction status on the decoded data is not 'COMPLETE'.
        if (decodedData.status !== "COMPLETE") {
            console.log(`Transaction ${decodedData.transaction_uuid} was not complete. Status: ${decodedData.status}`);
            return res.redirect(failureRedirectUrl + `?error=status_${decodedData.status}`);
        }

        // Step 2: **CRUCIAL SECURITY STEP**
        // Verify the transaction by making a server-to-server call to eSewa's verification API.
        const verificationUrl = `${ESEWA_VERIFY_URL}?product_code=${ESEWA_MERCHANT_CODE}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;
        
        const response = await axios.get(verificationUrl);
        const verificationResponse = response.data;
        
        // Final check on the response from eSewa's server.
        if (verificationResponse.status !== 'COMPLETE') {
            console.error(`Verification failed for ${decodedData.transaction_uuid}. eSewa server status: ${verificationResponse.status}`);
            return res.redirect(failureRedirectUrl + '?error=verification_failed');
        }
        
        // Step 3: Find the corresponding payment record in your database.
        const payment = await Payment.findOne({ transaction_uuid: decodedData.transaction_uuid });

        // Step 4: **Idempotency Check**
        // If payment not found, or if it's already marked as 'success', do nothing further.
        if (!payment) {
             console.error(`CRITICAL: Payment record not found for verified transaction_uuid: ${decodedData.transaction_uuid}`);
             return res.redirect(failureRedirectUrl + '?error=notfound');
        }
        if (payment.status === 'success') {
            console.log(`Transaction ${decodedData.transaction_uuid} already processed.`);
            return res.redirect(successRedirectUrl + `?refId=${payment.transaction_uuid}`);
        }

        // Step 5: Update your database.
        payment.status = 'success';
        await payment.save();

        // Add the amount to the user's wallet atomically.
        await User.findByIdAndUpdate(payment.userId, { $inc: { wallet: payment.amount } });
        console.log(`Successfully credited ${payment.amount} to user ${payment.userId}`);
        
        // Step 6: Redirect the user's browser to the final success page.
        res.redirect(successRedirectUrl + `?refId=${payment.transaction_uuid}`);

    } catch (error) {
        console.error("Fatal error in eSewa verification:", error.response ? error.response.data : error.message);
        res.redirect(failureRedirectUrl + '?error=server_error');
    }
};

/**
 * @desc    Get user's successful transaction history
 * @route   GET /api/payment/history
 * @access  Private
 */
exports.getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        // Find only successful payments for the user's history
        const payments = await Payment.find({ userId, status: 'success' })
                                      .sort({ createdAt: -1 }); // Show newest first
        
        return res.status(200).json({ success: true, data: payments });

    } catch (error) {
        console.error("Get transaction history error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};