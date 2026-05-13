import request from "supertest";
import { httpServer } from "../../src/app";
import { UserModel } from "../../src/model/user";

describe("auth integration test", () => {
  beforeEach(async () => {
    await UserModel.create({
      username: "user1",
      password: "password",
    });
  });

  afterEach(async () => {
    await UserModel.deleteMany();
  });

  it("should login user and return a token", async () => {
    const res = await request(httpServer).post("/api/user/login").send({
      username: "user1",
      password: "password",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it.each([
    {
      desc: "should return 401 invalid credentials - wrong user",
      payload: { username: "user2", password: "password" },
    },
    {
      desc: "should return 401 invalid credentials - wrong password",
      payload: { username: "user1", password: "passwords" },
    },
  ])("should return 401: $desc", async (payload) => {
    const res = await request(httpServer).post("/api/user/login").send(payload);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });
});
