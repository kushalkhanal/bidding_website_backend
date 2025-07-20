const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');


const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {

            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // console.log("DECODED TOKEN PAYLOAD:", decoded);


            // 3. Get user from the token's ID and attach to the request object
            // The payload property MUST match how you signed it in userController.js
            req.user = await User.findById(decoded.userId).select('-password');

            if (!req.user) {

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
const isAdmin = (req, res, next) => {

    // console.log("isAdmin CHECK: User role is", req.user?.role);

    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
module.exports = { protect, isAdmin };