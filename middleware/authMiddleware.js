// File: backend/middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware to verify the JWT and attach the user to the request object
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select('-password'); // Exclude password
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to check if the user has an 'admin' role. This MUST run AFTER protect.
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' }); // 403 Forbidden
    }
};

module.exports = { protect, isAdmin };