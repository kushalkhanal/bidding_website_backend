
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Payment = require('../models/paymentModel.js');
const User = require('../models/userModel.js');

let transaction_uuid_from_data = 'N/A'; // For logging


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



const processSuccessfulPayment = async (transaction_uuid) => {
    console.log(`[PROCESSOR] Attempting to process transaction: ${transaction_uuid}`);

    // --- THE ATOMIC OPERATION ---
    // Find a payment that is STILL 'pending' and atomically update its status to 'success'.
    // If it succeeds, 'updatedPayment' will be the document BEFORE the update.
    // If it fails (because it was already updated), 'updatedPayment' will be null.
    const updatedPayment = await Payment.findOneAndUpdate(
        { transaction_uuid: transaction_uuid, status: 'pending' },
        { $set: { status: 'success' } },
        { new: false } // Important: returns the document as it was before the update
    );

    // If 'updatedPayment' is null, another process already handled this. We do nothing.
    if (!updatedPayment) {
        console.log(`[PROCESSOR] Transaction ${transaction_uuid} was already processed. No action taken.`);
        return { alreadyProcessed: true };
    }

    // If we get here, this is the FIRST and ONLY time this block will run for this transaction.
    console.log(`[PROCESSOR] Successfully marked transaction ${transaction_uuid} as 'success'.`);

    // Update the user's wallet. This is now guaranteed to run only once.
    await User.findByIdAndUpdate(updatedPayment.userId, { $inc: { wallet: updatedPayment.amount } });
    console.log(`[PROCESSOR] Successfully credited ${updatedPayment.amount} to user ${updatedPayment.userId}'s wallet.`);

    return { alreadyProcessed: false };
};



/**
 * @desc    Verify the payment status with eSewa's server.
 * @route   GET /api/payment/verify
 * @access  Public (Called by eSewa's server)
 */
exports.verifyEsewaPayment = async (req, res) => {
    const successRedirectUrl = `${FRONTEND_URL}/payment/success`;
    const failureRedirectUrl = `${FRONTEND_URL}/payment/failure`;

    try {
        const { data } = req.query;
        if (!data) return res.redirect(failureRedirectUrl + '?error=nodata');

        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        if (decodedData.status !== "COMPLETE") {
            return res.redirect(failureRedirectUrl + `?error=status_${decodedData.status}`);
        }

        // Final verification call to eSewa's server...
        const verificationUrl = `${ESEWA_VERIFY_URL}?product_code=${ESEWA_MERCHANT_CODE}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;
        const response = await axios.get(verificationUrl);

        if (response.data.status === 'COMPLETE') {
            // Call the shared atomic processor function
            await processSuccessfulPayment(decodedData.transaction_uuid);
        } else {
            return res.redirect(failureRedirectUrl + '?error=verification_failed');
        }

        res.redirect(successRedirectUrl + `?data=${data}`); // Pass data back to frontend

    } catch (error) {
        console.error("Fatal error in secure eSewa verification:", error.message);
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




exports.confirmFrontendPayment = async (req, res) => {
    try {
        const { transaction_uuid } = req.body;
        if (!transaction_uuid) {
            return res.status(400).json({ success: false, message: "Transaction UUID is required." });
        }

        // Call the shared atomic processor function
        await processSuccessfulPayment(transaction_uuid);

        res.status(200).json({ success: true, message: "Wallet update processed." });

    } catch (error) {
        console.error("[DEV-CONFIRM] Error confirming payment:", error);
        res.status(500).json({ success: false, message: "Server error during confirmation." });
    }
};