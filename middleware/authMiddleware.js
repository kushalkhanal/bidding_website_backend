const jwt = require("jsonwebtoken")
const User = require("../models/User")

exports.authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization // from request header
        if (!authHeader) {
            return res.status(403).json(
                { "success": false, "message": "Token required" }
            )
        }
        const token = authHeader.split(" ")[1]; // "Bearer <token>"
        const decoded = jwt.verify(token, process.env.SECRET) // verify with same secret
        const userId = decoded._id // from payload
        const user = await User.findOne({ _id: userId })
        if (!user) {
            return res.status(401).json(
                { "success": false, "message": "User not found" }
            )
        }
        req.user = user // create new object for next function to use
        next() // continue to next function
    } catch (err) {
        return res.status(500).json(
            { "success": false, "message": "Authentication error" }
        )
    }
}

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next()
    } else {
        return res.status(403).json(
            { "success": false, "message": "Access denied, not admin" }
        )
    }
}