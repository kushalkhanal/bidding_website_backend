const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")


exports.registerUser = async (req, res) => {
    const { username, email, firstName, lastName, password } = req.body;

    if (!username || !email || !firstName || !lastName || !password) {
        return res.status(403).json({
            success: false,
            message: "Please fill all the fields"
        });
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the user
        const newUser = new User({
            username,
            email,
            firstName,
            lastName,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully"
        });

    } catch (e) {
        console.error("Error in registerUser:", e);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            "success": false,
            "message": "email and password are required "
        })
    }
    try {
        const user = await User.findOne({
            $or: [{ email: email }]
        });
        if (!user) {
            return res.status(400).json({
                "success": false,
                "message": "user not found"
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                "success": false,
                "message": "invalid credentials"
            })
        }

        const token = jwt.sign(
            {
                userId: user._id, email: email
            },
            process.env.JWT_SECRET, { expiresIn: "7d" }
        );
        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

