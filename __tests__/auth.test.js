
const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const User = require("../models/userModel.js");

describe("User Authentication API", () => {
    const testUser = {
        firstName: "Test",
        lastName: "User",
        number: "9876543210",
        email: "testuser@example.com",
        password: "password123"
    };

    // This runs ONCE before all tests in this file.
    beforeAll(async () => {
        // We set the NODE_ENV to 'test' to prevent console logs from db.js
        process.env.NODE_ENV = 'test';
        await mongoose.connect(process.env.DB_URI);
        // Clean up any old test users before starting
        await User.deleteOne({ email: testUser.email });
    });

    // This runs ONCE after all tests in this file are complete.
    afterAll(async () => {
        // Clean up the user we created during the test
        await User.deleteOne({ email: testUser.email });
        await mongoose.disconnect();
    });

    // Test Case 1: Validation
    test("should return 400 if required fields are missing on registration", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ firstName: "Incomplete", email: "incomplete@example.com" });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Please fill all the fields");
    });

    // Test Case 2: Successful Registration
    test("should successfully register a new user with all fields", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User registered successfully");
    });

    // Test Case 3: Duplicate Registration
    test("should return 409 if trying to register with an existing email", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(res.statusCode).toBe(409);
        expect(res.body.message).toBe("A user with this email or phone number already exists.");
    });
});