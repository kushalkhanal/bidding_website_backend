
const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const { testUser, adminUser, getAuthToken, getAdminToken } = require("./setup"); // Import token getters

describe("Public & User Bidding API (/api/bidding-rooms)", () => {
    let createdRoomId;

    // Test: Should allow anyone to fetch a list of active bidding rooms
    test("GET / should return a paginated object with a products array", async () => {
    const res = await request(app).get("/api/bidding-rooms");
    expect(res.statusCode).toBe(200);
    // Now we check that the 'products' key within the response body is an array.
    expect(Array.isArray(res.body.products)).toBe(true); 
});

    // Test: Should allow a logged-in user to create a new listing
    test("POST / should create a new bidding room for an authenticated user", async () => {
        const token = getAuthToken(); // Get the valid token for the regular user
        const res = await request(app)
            .post("/api/bidding-rooms")
            .set("Authorization", `Bearer ${token}`)
            .field("name", "Test Watch from Bidding Test")
            .field("description", "A nice watch")
            .field("startingPrice", 100)
            .field("endTime", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
            .attach("productImages", Buffer.from("fake_image_data"), "test-image.jpg");
        
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe("Test Watch from Bidding Test");
        createdRoomId = res.body._id; // Save ID for subsequent tests
    });

    // Test: Should allow anyone to view a single bidding room
    test("GET /:id should return a single bidding room", async () => {
        const res = await request(app).get(`/api/bidding-rooms/${createdRoomId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBe(createdRoomId);
    });

    // Test: Should return 404 for a non-existent room ID
    test("GET /:id should return 404 for an invalid room ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/bidding-rooms/${nonExistentId}`);
        expect(res.statusCode).toBe(404);
    });

    // Test: Should prevent unauthenticated users from bidding
    test("POST /:id/bids should return 401 if user is not logged in", async () => {
        const res = await request(app).post(`/api/bidding-rooms/${createdRoomId}/bids`).send({ amount: 110 });
        expect(res.statusCode).toBe(401);
    });

    // Test: Should prevent a user from bidding on their own item
    test("POST /:id/bids should return 400 if a user bids on their own item", async () => {
        const token = getAuthToken(); // The user who created the item
        const res = await request(app)
            .post(`/api/bidding-rooms/${createdRoomId}/bids`)
            .set("Authorization", `Bearer ${token}`)
            .send({ amount: 110 }); // Try to bid on their own item
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("You cannot bid on your own item.");
    });

    // Test: Should successfully place a bid for an authenticated user with sufficient funds
    test("POST /:id/bids should successfully place a bid", async () => {
        const token = getAdminToken(); // Use the admin user as the bidder

        // --- THIS IS THE FIX ---
        // Before placing the bid, we ensure the bidder has enough money in their wallet.
        await User.updateOne({ email: adminUser.email }, { $set: { wallet: 500 } });
        // -----------------------

        const res = await request(app)
            .post(`/api/bidding-rooms/${createdRoomId}/bids`)
            .set("Authorization", `Bearer ${token}`)
            .send({ amount: 120 });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("Bid placed successfully!");
        expect(res.body.room.currentPrice).toBe(120);
    });
});