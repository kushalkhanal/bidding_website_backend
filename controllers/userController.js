const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

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

        // Hash the password
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
