const request = require("supertest");
const app = require("../index");
const User = require("../models/userModel.js"); // Import User model for direct DB interaction
const { testUser, adminUser, getAuthToken, getAdminToken } = require("./setup");

describe("User Profile API (/api/profile)", () => {

    // Test Case 1 (Existing): Fetch all profile data at once
    test("GET / should return the complete profile data for the authenticated user", async () => {
        const token = getAuthToken();
        const res = await request(app)
            .get("/api/profile")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.profile).toBeDefined();
        expect(res.body.profile.email).toBe(testUser.email);
        expect(res.body.listedItems).toBeDefined();
        expect(res.body.bidHistory).toBeDefined();
    });

    // Test Case 2 (Existing): Successfully update profile
    test("PUT / should update the profile for the authenticated user", async () => {
        const token = getAuthToken();
        const res = await request(app)
            .put("/api/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({
                firstName: "UpdatedFirst",
                location: "Pokhara"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.user.firstName).toBe("UpdatedFirst");
        expect(res.body.user.location).toBe("Pokhara");
        expect(res.body.token).toBeDefined();
    });

    // --- NEW TEST CASES ---

    // Test Case 3 (New): Test the 'getMyListedItems' controller and route
    test("GET /listed-items should return an array of items the user is selling", async () => {
        const token = getAuthToken();
        const res = await request(app)
            .get("/api/profile/listed-items")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        // We expect it to be an array, even if it's empty
        expect(Array.isArray(res.body)).toBe(true);
    });

    // Test Case 4 (New): Test the 'getMyBidHistory' user-specific route
    test("GET /users/my-bids should return the user's bid history", async () => {
        const token = getAuthToken();
        const res = await request(app)
            .get("/api/users/my-bids") // This tests the separate user route
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.winning).toBeDefined();
        expect(res.body.activeOrOutbid).toBeDefined();
    });

    // Test Case 5 (New): Test validation for updating to a duplicate phone number
    test("PUT / should return 400 when trying to update to a number already in use", async () => {
        const token = getAuthToken();
        const res = await request(app)
            .put("/api/profile")
            .set("Authorization", `Bearer ${token}`)
            // Try to set the regular user's number to the admin's number
            .send({ number: adminUser.number });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("This phone number is already in use by another account.");
    });

    // Test Case 6 (Existing, but good to keep): Test security
    test("GET / should return 401 if no token is provided", async () => {
        const res = await request(app).get("/api/profile");
        expect(res.statusCode).toBe(401);
    });
});