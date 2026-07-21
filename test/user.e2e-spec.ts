import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "src/app.module";
import { TransformInterceptor } from "src/common/interceptors/transform.interceptor";
import { GlobalExceptionFilter } from "src/common/filters/global-exception.filter";
import mongoose, { Connection } from "mongoose";
import { getConnectionToken } from "@nestjs/mongoose";

describe("UserController (e2e)", () => {
  let app: INestApplication<App>;
  let dbConnection: Connection;
  let loginToken: string;
  let userId: string;
  let httpServer: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix("api");
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    httpServer = app.getHttpServer();
    dbConnection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await dbConnection.close();
    await app.close();
  });

  beforeEach(async () => {
    await request(httpServer).post("/api/user/register").send({
      username: "user1",
      password: "password",
    });

    const res = await request(httpServer).post("/api/user/login").send({
      username: "user1",
      password: "password",
    });

    userId = res.body.data.id;
    loginToken = res.body.data.token;
  });

  afterEach(async () => {
    await dbConnection.collection("users").deleteMany({});
  });

  it("sanity check", async () => {
    const res = await request(httpServer).get("/api/user");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Sanity check");
  });

  it("should register user", async () => {
    const res = await request(httpServer).post("/api/user/register").send({ username: "user2", password: "password" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
  });

  it("should not create a duplicate user", async () => {
    const res = await request(httpServer).post("/api/user/register").send({
      username: "user1",
      password: "password",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Username already exists");
  });

  it("should login user and return a token", async () => {
    const res = await request(httpServer).post("/api/user/login").send({
      username: "user1",
      password: "password",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User logged in successfully");
    expect(res.body.data.token).toBeDefined();
  });

  it("should return 401: invalid credentials - wrong user", async () => {
    const res = await request(httpServer).post("/api/user/login").send({ username: "user2", password: "password" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("should return 401 invalid credentials - wrong password", async () => {
    const res = await request(httpServer).post("/api/user/login").send({
      username: "user1",
      password: "passwords",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("should return users information", async () => {
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
      .get(`/api/user/stats/${userId}`)
      .set({ Authorization: "Bearer " + loginToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User's personal stats");
    expect(res.body.data.totalBoards).toBeUndefined();
  });

  it("should return 500", async () => {
    const res = await request(httpServer)
      .get("/api/user/stats/99")
      .set({ Authorization: "Bearer " + loginToken });

    expect(res.status).toBe(500);
  });

  it("should return user not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(httpServer)
      .get("/api/user/stats/" + fakeId)
      .set({ Authorization: "Bearer " + loginToken });

    expect(res.status).toBe(404);
    expect(res.body.message).toBeUndefined();
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
