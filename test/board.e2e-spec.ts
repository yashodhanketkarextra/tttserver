import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AuthHelper } from "src/lib/auth";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "src/app.module";
import { TransformInterceptor } from "src/common/interceptors/transform.interceptor";
import { GlobalExceptionFilter } from "src/common/filters/global-exception.filter";
import { Connection, Model } from "mongoose";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { User } from "src/user/user.schema";
import { Board, BoardDocument } from "src/boards/boards.schema";

describe("BoardController (e2e)", () => {
  let app: INestApplication<App>;
  let dbConnection: Connection;
  let httpServer: App;

  let creatorId: string;
  let opponentId: string;
  let creatorToken: string;
  let opponentToken: string;

  let authHelper: AuthHelper;
  let userModel: Model<User>;
  let boardModel: Model<Board>;

  let board: BoardDocument;

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
    authHelper = app.get<AuthHelper>(AuthHelper);

    userModel = app.get<Model<User>>(getModelToken(User.name));
    boardModel = app.get<Model<Board>>(getModelToken(Board.name));
  });

  afterAll(async () => {
    await dbConnection.close();
    await app.close();
  });

  beforeEach(async () => {
    const userCreator = await userModel.create({ username: "userC", password: "password" });
    const userOpponent = await userModel.create({ username: "userO", password: "password" });

    creatorId = userCreator._id.toString();
    opponentId = userOpponent._id.toString();

    creatorToken = await authHelper.getToken({ _id: creatorId, username: userCreator.username });
    opponentToken = await authHelper.getToken({ _id: opponentId, username: userOpponent.username });

    board = await boardModel.create({
      startedBy: creatorId,
      against: opponentId,
      numberOfPlayers: 2,
    });
  });

  afterEach(async () => {
    await dbConnection.collection("boards").deleteMany({});
    await dbConnection.collection("users").deleteMany({});
  });

  it("should create a new board", async () => {
    const res = await request(httpServer)
      .post("/api/board/new")
      .set({ Authorization: "Bearer " + creatorToken });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Board created");
    expect(res.body.data.board.startedBy).toBe(creatorId);
    expect(res.body.data.board.numberOfPlayers).toBe(1);
  });

  it("should join a board", async () => {
    const joinBoard = await boardModel.create({
      startedBy: creatorId,
      numberOfPlayers: 1,
    });

    const res = await request(httpServer)
      .put("/api/board/saved/" + joinBoard._id.toString())
      .set({ Authorization: "Bearer " + opponentToken })
      .send({ key: joinBoard.key });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Joined board");
    expect(res.body.data.status.grid).toBeDefined();
    expect(res.body.data.status.currentMark).toBe("X");
  });

  it("should return board correctly", async () => {
    const res = await request(httpServer)
      .get("/api/board/" + board._id.toString())
      .set({ Authorization: "Bearer " + creatorToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Board information");
    expect(res.body.data.startedBy).toBe(creatorId);
    expect(res.body.data.numberOfPlayers).toBe(2);
    expect(res.body.data.key).toBeDefined();
  });

  it("should process legal move", async () => {
    const legalRes = await request(httpServer)
      .put("/api/board/move/" + board._id.toString())
      .set({ Authorization: "Bearer " + opponentToken })
      .send({ index: 1 });

    expect(legalRes.status).toBe(200);
    expect(legalRes.body.message).toBe("Move made on 1");
    expect(legalRes.body.data.board.grid[0]).toBe("X");
  });

  it("should block illegal move", async () => {
    const outOfTurnRes = await request(httpServer)
      .put("/api/board/move/" + board._id.toString())
      .set({ Authorization: "Bearer " + creatorToken })
      .send({ index: 1 });

    expect(outOfTurnRes.status).toBe(400);
    expect(outOfTurnRes.body.error).toBe("Illegal move - Out of turn");

    await request(httpServer)
      .put("/api/board/move/" + board._id.toString())
      .set({ Authorization: "Bearer " + opponentToken })
      .send({ index: 1 });

    const illegalMoveRes = await request(httpServer)
      .put("/api/board/move/" + board._id.toString())
      .set({ Authorization: "Bearer " + creatorToken })
      .send({ index: 1 });

    expect(illegalMoveRes.status).toBe(400);
    expect(illegalMoveRes.body.error).toBe("Illegal move - Not allowed");
  });
});
