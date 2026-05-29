const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe("POST /api/v1/auth/signup", () => {
  it("creates a user with valid data", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "testuser", email: "test@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined(); // ⚠️ currently fails — password is exposed
  });

  it("rejects duplicate email", async () => {
    await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "user1", email: "dup@test.com", password: "password123" });

    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "user2", email: "dup@test.com", password: "password456" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "nope" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "testuser", email: "test@test.com", password: "password123" });
  });

  it("returns token with valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });
});
