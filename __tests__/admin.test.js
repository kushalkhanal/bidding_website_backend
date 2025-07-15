
const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const BiddingRoom = require("../models/biddingRoomModel");
const { testUser, adminUser } = require("./setup");

let adminToken;
let regularUserToken;
let roomToDeleteId;

beforeAll(async () => {
    // Log in as admin to get the token
    await User.updateOne({ email: adminUser.email }, { $set: { role: 'admin' } });
    const adminRes = await request(app).post("/api/auth/login").send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminRes.body.token;

    // Log in as a regular user to get their token
    const userRes = await request(app).post("/api/auth/login").send({ email: testUser.email, password: testUser.password });
    regularUserToken = userRes.body.token;

    // Create a room that we can test deleting later
    const room = await new BiddingRoom({ name: "Room to Delete", description: "desc", startingPrice: 10, endTime: new Date(), imageUrls: ["/path"], seller: new mongoose.Types.ObjectId() }).save();
    roomToDeleteId = room._id;
});


describe("Admin API - User Management (/api/admin/users)", () => {
    
    // Test: Ensure non-admins cannot access user list
    test("GET / should return 403 Forbidden for a regular user", async () => {
        const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${regularUserToken}`);
        expect(res.statusCode).toBe(403);
    });

    // Test: Ensure admins can access the user list
    test("GET / should return a list of users for an admin", async () => {
        const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    // Test: Ensure an admin can delete another user
    test("DELETE /:id should delete a user", async () => {
        const userToDelete = await User.findOne({ email: testUser.email });
        const res = await request(app).delete(`/api/admin/users/${userToDelete._id}`).set("Authorization", `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("User deleted successfully");
    });
});

describe("Admin API - Bidding Room Management (/api/admin/bidding-rooms)", () => {

    // Test: Ensure an admin can get a list of all bidding rooms
    test("GET / should return all bidding rooms for an admin", async () => {
        const res = await request(app).get("/api/admin/bidding-rooms").set("Authorization", `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
    });

    // Test: Ensure a regular user cannot create a room via the admin route
    test("POST / should return 403 Forbidden for a regular user", async () => {
        const res = await request(app)
            .post("/api/admin/bidding-rooms")
            .set("Authorization", `Bearer ${regularUserToken}`)
            .field("name", "Illegal Room")
            .field("description", "desc")
            .field("startingPrice", 10)
            .field("endTime", new Date().toISOString())
            .attach("productImages", Buffer.from("fake"), "fake.jpg");
        expect(res.statusCode).toBe(403);
    });

    // Test: Ensure an admin can delete a bidding room
    test("DELETE /:id should delete a bidding room", async () => {
        const res = await request(app).delete(`/api/admin/bidding-rooms/${roomToDeleteId}`).set("Authorization", `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Bidding room deleted successfully");
    });
});