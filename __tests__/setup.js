

const mongoose = require("mongoose");
const User = require("../models/userModel.js");
const BiddingRoom = require("../models/biddingRoomModel.js");

// --- Define Test Data ---
const testUser = {
    firstName: "Test",
    lastName: "User",
    number: "9876543210",
    email: "test.user@example.com",
    password: "password123"
};

const adminUser = {
    firstName: "Admin",
    lastName: "User",
    number: "9876543211",
    email: "test.admin@example.com",
    password: "password123",
};

// --- Global Setup and Teardown Hooks ---
beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await mongoose.connect(process.env.DB_URI);
    // Clean up any old test users before starting
    await User.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });
});

afterAll(async () => {
    // Clean up all test data after the entire suite has run
    await User.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });
    await BiddingRoom.deleteMany({ 'seller.email': { $in: [testUser.email, adminUser.email] } });
    await mongoose.disconnect();
});

// We export the test data so other files can use it
module.exports = { testUser, adminUser };