const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const { testUser, adminUser } = require("./setup");

let userToken;
let createdRoomId;

// Fetch a login token before running tests in this file
beforeAll(async () => {
    // We need a registered user to get a token
    await request(app).post("/api/auth/register").send(testUser);
    const res = await request(app).post("/api/auth/login").send({ email: testUser.email, password: testUser.password });
    userToken = res.body.token;
});

describe("Public & User Bidding API (/api/bidding-rooms)", () => {
    
    // Test: Should allow anyone to fetch a list of active bidding rooms
    test("GET / should return a list of bidding rooms", async () => {
        const res = await request(app).get("/api/bidding-rooms");
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    // Test: Should allow a logged-in user to create a new listing
    test("POST / should create a new bidding room for an authenticated user", async () => {
        const res = await request(app)
            .post("/api/bidding-rooms")
            .set("Authorization", `Bearer ${userToken}`)
            .field("name", "Vintage Fountain Pen")
            .field("description", "A classic pen from the 1950s.")
            .field("startingPrice", 50)
            .field("endTime", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
            .attach("productImages", Buffer.from("fake_image"), "pen.jpg");
        
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe("Vintage Fountain Pen");
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
        const res = await request(app).post(`/api/bidding-rooms/${createdRoomId}/bids`).send({ amount: 60 });
        expect(res.statusCode).toBe(401);
    });

    // Test: Should prevent users from bidding on their own item
    test("POST /:id/bids should return 400 if a user bids on their own item", async () => {
        const res = await request(app)
            .post(`/api/bidding-rooms/${createdRoomId}/bids`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ amount: 70 });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("You cannot bid on your own item.");
    });

    // Test: Should successfully place a bid for an authenticated user with sufficient funds
    test("POST /:id/bids should successfully place a bid", async () => {
        // Create another user to act as the bidder
        const bidder = await new User({ ...adminUser }).save();
        await User.updateOne({ _id: bidder._id }, { $set: { wallet: 500 } });
        const bidderRes = await request(app).post("/api/auth/login").send({ email: adminUser.email, password: adminUser.password });
        const bidderToken = bidderRes.body.token;

        const res = await request(app)
            .post(`/api/bidding-rooms/${createdRoomId}/bids`)
            .set("Authorization", `Bearer ${bidderToken}`)
            .send({ amount: 60 });

        expect(res.statusCode).toBe(201);
        expect(res.body.room.currentPrice).toBe(60);
    });
});