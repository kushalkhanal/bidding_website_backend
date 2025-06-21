// File: backend/controllers/admin/userManagement.controller.js

const User = require('../../models/user.model');

// @desc    Get all users for the admin panel
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// @desc    Delete a user by ID
exports.deleteUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await user.deleteOne();
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};