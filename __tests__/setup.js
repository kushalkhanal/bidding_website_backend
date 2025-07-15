
const mongoose = require("mongoose");
const request = require("supertest"); // We need supertest here now
const app = require("../index"); // We need the app to make login requests
const User = require("../models/userModel.js");
const BiddingRoom = require("../models/biddingRoomModel.js");

// Define test data
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

let userToken;
let adminToken;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await mongoose.connect(process.env.DB_URI);
    
    // Clean up old test data
    await User.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });
    await BiddingRoom.deleteMany({});

    // --- THIS IS THE NEW LOGIC ---
    // 1. Create the users
    await request(app).post("/api/auth/register").send(testUser);
    await request(app).post("/api/auth/register").send(adminUser);
    // 2. Manually set one user's role to admin
    await User.updateOne({ email: adminUser.email }, { $set: { role: 'admin' } });

    // 3. Log in both users and store their tokens globally
    const userRes = await request(app).post("/api/auth/login").send({ email: testUser.email, password: testUser.password });
    userToken = userRes.body.token;

    const adminRes = await request(app).post("/api/auth/login").send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminRes.body.token;
    // ----------------------------
});

afterAll(async () => {
    await User.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });
    await mongoose.disconnect();
});

// Export everything needed by the other test files
module.exports = {
    testUser,
    adminUser,
    getAuthToken: () => userToken, // Use functions to avoid stale values
    getAdminToken: () => adminToken,
};