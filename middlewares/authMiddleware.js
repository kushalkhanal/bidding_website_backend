// File: backend/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');

// Middleware to verify the JWT and attach the user to the request object
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // --- DEBUGGING LOG ---
            console.log("DECODED TOKEN PAYLOAD:", decoded);
            // ---------------------

            // 3. Get user from the token's ID and attach to the request object
            // The payload property MUST match how you signed it in userController.js
            req.user = await User.findById(decoded.userId).select('-password'); 

            if (!req.user) {
                // This happens if the user was deleted after the token was issued
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Success! Proceed to the next middleware (isAdmin)
        } catch (error) {
            console.error("TOKEN ERROR:", error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to check if the user has an 'admin' role. This MUST run AFTER protect.
const isAdmin = (req, res, next) => {
    // --- DEBUGGING LOG ---
    console.log("isAdmin CHECK: User role is", req.user?.role);
    // ---------------------

    if (req.user && req.user.role === 'admin') {
        next(); // Success! Proceed to the controller
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, isAdmin };