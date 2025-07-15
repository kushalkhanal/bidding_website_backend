
const request = require("supertest");
const app = require("../index");
const { testUser } = require("./setup");

let userToken;
beforeAll(async () => {
    const res = await request(app).post("/api/auth/login").send({ email: testUser.email, password: testUser.password });
    userToken = res.body.token;
});

describe("User Profile API (/api/profile)", () => {
    
    // Test: Should successfully fetch the logged-in user's complete profile data
    test("GET / should return the profile data for the authenticated user", async () => {
        const res = await request(app)
            .get("/api/profile")
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.profile).toBeDefined();
        expect(res.body.profile.email).toBe(testUser.email);
        expect(res.body.listedItems).toBeDefined();
        expect(res.body.bidHistory).toBeDefined();
    });

    // Test: Should successfully update the user's profile information
    test("PUT / should update the profile for the authenticated user", async () => {
        const res = await request(app)
            .put("/api/profile")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                firstName: "UpdatedFirst",
                location: "Pokhara"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.user.firstName).toBe("UpdatedFirst");
        expect(res.body.user.location).toBe("Pokhara");
        expect(res.body.token).toBeDefined(); // Check that a new token is returned
    });

    // Test: Should fail to fetch profile data without an authentication token
    test("GET / should return 401 if no token is provided", async () => {
        const res = await request(app).get("/api/profile");
        expect(res.statusCode).toBe(401);
    });
});