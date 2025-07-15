
const request = require("supertest");
const app = require("../index");
const User = require("../models/userModel.js");
const { testUser } = require("./setup"); // Import our standard test user data

// Test Suite for the User Authentication API
describe("Authentication API (/api/auth)", () => {

    // This hook runs BEFORE each individual test in this file.
    beforeEach(async () => {
        // We delete the test user to ensure each test starts from a known state.
        await User.deleteOne({ email: testUser.email });
    });

    // This hook runs AFTER each individual test in this file.
    afterEach(async () => {
        // A final cleanup to be absolutely sure.
        await User.deleteOne({ email: testUser.email });
    });


    // --- REGISTRATION TESTS ---

    // Test Case 1: Validation
    test("POST /register - should respond with 400 if required fields are missing", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                firstName: "Incomplete",
                email: "incomplete@example.com"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Please fill all the fields");
    });

    // Test Case 2: Successful Registration
    test("POST /register - should respond with 201 when a new user is registered successfully", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User registered successfully");
    });

    // Test Case 3: Duplicate Registration
    test("POST /register - should respond with 409 if email already exists", async () => {
        // Step 1: Create the user first.
        await request(app).post("/api/auth/register").send(testUser);

        // Step 2: Try to create the same user again.
        const res = await request(app)
            .post("/api/auth/register")
            .send({ ...testUser, number: "9999999999" }); // Use a different number but same email

        expect(res.statusCode).toBe(409);
        expect(res.body.message).toContain("email or phone number already exists");
    });


    // --- LOGIN TESTS ---

    // Test Case 4: Non-existent User
    test("POST /login - should respond with 404 for a non-existent email", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nouser@example.com", password: "password123" });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("User not found");
    });

    // Test Case 5: Incorrect Password
    test("POST /login - should respond with 401 for an incorrect password", async () => {
        // Step 1: Create the user so they exist in the database.
        await request(app).post("/api/auth/register").send(testUser);

        // Step 2: Attempt to log in with the wrong password.
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: "wrongpassword" });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Invalid credentials");
    });

    // Test Case 6: Successful Login
    test("POST /login - should respond with 200 and a JWT for a successful login", async () => {
        // Step 1: Create the user first.
        await request(app).post("/api/auth/register").send(testUser);

        // Step 2: Log in with the correct credentials.
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: testUser.password });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });
});