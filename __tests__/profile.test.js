
const request = require("supertest");
const app = require("../index");
const { testUser, getAuthToken } = require("./setup");

describe("User Profile API (/api/profile)", () => {
    
    // Test: Should successfully fetch the logged-in user's complete profile data
    test("GET / should return profile data for the authenticated user", async () => {
        const token = getAuthToken();
        const res = await request(app)
            .get("/api/profile")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.profile).toBeDefined();
        expect(res.body.profile.email).toBe(testUser.email);
    });

    // Test: Should successfully update the user's profile information
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

    // Test: Should fail to fetch profile data without an authentication token
    test("GET / should return 401 if no token is provided", async () => {
        const res = await request(app).get("/api/profile");
        expect(res.statusCode).toBe(401);
    });
});