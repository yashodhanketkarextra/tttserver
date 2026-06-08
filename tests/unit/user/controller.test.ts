import request from "supertest";
import { httpServer } from "../../../src/app";
import { UserModel } from "../../../src/model/user";

describe("user controller tests", () => {
  let loginToken: string;

  beforeEach(async () => {
    await UserModel.create({
      username: "user1",
      password: "password",
    });

    const res = await request(httpServer).post("/api/user/login").send({
      username: "user1",
      password: "password",
    });
    loginToken = res.body.data.token;
  });

  afterEach(async () => {
    await UserModel.deleteMany();
  });

  it("should register user", async () => {
    const res = await request(httpServer)
      .post("/api/user/register")
      .send({ username: "user2", password: "password" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User Created");
  });

  it("should not create a duplicate user", async () => {
    const res = await request(httpServer).post("/api/user/register").send({
      username: "user1",
      password: "password",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User already exists");
  });

  it("should login user and return a token", async () => {
    const res = await request(httpServer).post("/api/user/login").send({
      username: "user1",
      password: "password",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User logged in");
    expect(res.body.data.token).toBeDefined();
  });

  it("should return 401: invalid credentials - wrong user", async () => {
    const res = await request(httpServer)
      .post("/api/user/login")
      .send({ username: "user2", password: "password" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should return 401 invalid credentials - wrong password", async () => {
    const res = await request(httpServer).post("/api/user/login").send({
      username: "user1",
      password: "passwords",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should users information", async () => {
    const res = await request(httpServer)
      .get("/api/user/me")
      .set("Authorization", "Bearer " + loginToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User information");
    expect(res.body.data.username).toBe("user1");
    expect(res.body.data.id).toBeDefined();
  });

  it("should return users personal stats", async () => {
    const res = await request(httpServer)
      .get("/api/user/stats/1")
      .set({ Authorization: "Bearer " + loginToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User's personal stats");
    expect(res.body.data.totalBoards).toBeUndefined();
  });

  it("should return user not found", async () => {
    const res = await request(httpServer)
      .get("/api/user/stats/99")
      .set({ Authorization: "Bearer " + loginToken });

    console.log(res.body);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  it("should return all users stats", async () => {
    const res = await request(httpServer)
      .get("/api/user/stats")
      .set({
        Authorization: "Bearer " + loginToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("All users stats");
    expect(res.body.data.totalBoards).toBeUndefined();
  });
});
