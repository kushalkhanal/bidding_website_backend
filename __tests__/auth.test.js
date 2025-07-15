

const request = require("supertest");
const app = require("../index"); // Our Express app
const { testUser } = require("./setup"); // Import our standard test user data

// Test Suite for the User Authentication API
describe("POST /api/auth", () => {

    // --- Registration Tests ---

    // Test Case 1: Testing server-side validation for required fields.
    test("should respond with 400 Bad Request if required fields are missing during registration", async () => {
        // Action: Send a request with only some of the required data
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                firstName: "Incomplete",
                email: "incomplete@example.com"
            });

        // Assertion: Expect the server to reject the request
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Please fill all the fields");
    });

    // Test Case 2: Testing the primary success path for registration.
    test("should respond with 201 Created when a new user is registered successfully", async () => {
        // Action: Send a complete and valid registration request
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        // Assertion: Expect a successful creation status
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User registered successfully");
    });

    // Test Case 3: Testing the duplicate user constraint.
    test("should respond with 409 Conflict if trying to register with an existing email", async () => {
        // Action: Attempt to register again with the same email but a different phone number
        const res = await request(app)
            .post("/api/auth/register")
            .send({ ...testUser, number: "9999999999" });

        // Assertion: Expect the server to detect the conflict
        expect(res.statusCode).toBe(409);
        expect(res.body.message).toContain("email or phone number already exists");
    });


    // --- Login Tests ---

    // Test Case 4: Testing login with a non-existent user.
    test("should respond with 404 Not Found for login with a non-existent email", async () => {
        // Action: Attempt to log in with an email not in the database
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nouser@example.com", password: "password123" });

        // Assertion: Expect a user not found error
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("User not found");
    });

    // Test Case 5: Testing login with a correct email but wrong password.
    test("should respond with 401 Unauthorized for login with an incorrect password", async () => {

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: "wrongpassword" });


        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Invalid credentials");
    });

    // Test Case 6: Testing the primary success path for login.
    test("should respond with 200 OK and a JWT token for a successful login", async () => {

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: testUser.password });


        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.token.length).toBeGreaterThan(20);
    });
});