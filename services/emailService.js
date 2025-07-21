const nodemailer = require('nodemailer');

// Configure the email transporter using your .env variables
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports like 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends a password reset OTP to the user's email.
 * @param {string} to - The recipient's email address.
 * @param {string} otp - The one-time password.
 */
const sendPasswordResetOTP = async (to, otp) => {
    try {
        const mailOptions = {
            from: `"Bidding Bazar" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Your Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>You requested a password reset for your Bidding Bazar account. Use the following One-Time Password (OTP) to proceed.</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">${otp}</p>
                    <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                    <p>Thank you,<br/>The Bidding Bazar Team</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent: %s', info.messageId);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, message: 'Failed to send email' };
    }
};

module.exports = { sendPasswordResetOTP };