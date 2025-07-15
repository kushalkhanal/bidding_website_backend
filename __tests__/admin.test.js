
const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const BiddingRoom = require("../models/biddingRoomModel");
const { testUser, adminUser, getAuthToken, getAdminToken } = require("./setup");

describe("Admin API - User Management (/api/admin/users)", () => {
    
    // Test: Ensure non-admins cannot access the user list
    test("GET / should return 403 Forbidden for a regular user", async () => {
        const token = getAuthToken(); // Use regular user's token
        const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(403);
    });

    // Test: Ensure admins can access the user list
    test("GET / should return a list of users for an admin", async () => {
        const token = getAdminToken(); // Use admin's token
        const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    // Test: Ensure an admin can delete another user
    test("DELETE /:id should delete a user", async () => {
        const token = getAdminToken();
        // Create a temporary user to delete so we don't affect other tests
        const tempUser = await new User({ ...testUser, email: "temp.delete@example.com", number: "1111111111" }).save();
        const res = await request(app).delete(`/api/admin/users/${tempUser._id}`).set("Authorization", `Bearer ${token}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("User deleted successfully");
    });
});

describe("Admin API - Bidding Room Management (/api/admin/bidding-rooms)", () => {
    let roomToDeleteId;

    // Create a room to be deleted in a later test
    beforeAll(async () => {
        const token = getAdminToken();
        const res = await request(app)
            .post("/api/admin/bidding-rooms")
            .set("Authorization", `Bearer ${token}`)
            .field("name", "Room to be Deleted")
            .field("description", "A test room for deletion")
            .field("startingPrice", 1)
            .field("endTime", new Date().toISOString())
            .attach("productImages", Buffer.from("fake"), "delete.jpg");
        roomToDeleteId = res.body._id;
    });
    
    // Test: Ensure an admin can get a list of all bidding rooms
    test("GET / should return all bidding rooms for an admin", async () => {
        const token = getAdminToken();
        const res = await request(app).get("/api/admin/bidding-rooms").set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    // Test: Ensure a regular user cannot create a room via the admin route
    test("POST / should return 403 Forbidden for a regular user", async () => {
        const token = getAuthToken();
        const res = await request(app)
            .post("/api/admin/bidding-rooms")
            .set("Authorization", `Bearer ${token}`)
            .field("name", "Illegal Room")
            .field("description", "desc")
            .field("startingPrice", 10)
            .field("endTime", new Date().toISOString())
            .attach("productImages", Buffer.from("fake"), "fake.jpg");
        expect(res.statusCode).toBe(403);
    });

    // Test: Ensure an admin can delete a bidding room
    test("DELETE /:id should delete a bidding room", async () => {
        const token = getAdminToken();
        const res = await request(app).delete(`/api/admin/bidding-rooms/${roomToDeleteId}`).set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Bidding room deleted successfully");
    });
});