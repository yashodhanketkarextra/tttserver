import request from "supertest";
import { httpServer } from "../../../src/app";
import { AuthHelper } from "../../../src/lib/auth";
import { UserModel } from "../../../src/model/user";
import { BoardModel } from "../../../src/model/board";

describe("board controller tests", () => {
  let userCreator: InstanceType<typeof UserModel>;
  let userPlayer: InstanceType<typeof UserModel>;
  let board: InstanceType<typeof BoardModel>;
  let tokenCreator: string;
  let tokenPlayer: string;
  const authHelper = new AuthHelper();

  beforeEach(async () => {
    userCreator = await UserModel.create({
      username: "user1",
      password: "password",
    });
    tokenCreator = await authHelper.getToken(userCreator as any);

    userPlayer = await UserModel.create({
      username: "user2",
      password: "password",
    });
    tokenPlayer = await authHelper.getToken(userPlayer as any);
  });

  describe("create board", () => {
    it("should creat a new board", async () => {
      const res = await request(httpServer)
        .get("/api/board/new")
        .set({ Authorization: "Bearer " + tokenCreator });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Board created");
      expect(res.body.data.startedBy).toBe(String(userCreator._id));
      expect(res.body.data.numberOfPlayers).toBe(1);
    });

    it("should join a board", async () => {
      const createRes = await request(httpServer)
        .get("/api/board/new")
        .set({ Authorization: "Bearer " + tokenCreator });

      const board = createRes.body.data._id;
      const key = createRes.body.data.key;

      const res = await request(httpServer)
        .put("/api/board/saved/" + String(board))
        .set({ Authorization: "Bearer " + tokenPlayer })
        .send({ key });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Joined board");
      expect(res.body.data.status.grid).toBeDefined();
      expect(res.body.data.status.currentMark).toBe("X");
    });
  });

  describe("board", () => {
    beforeEach(async () => {
      board = await BoardModel.create({
        startedBy: userCreator._id,
        against: userPlayer._id,
        numberOfPlayers: 2,
      });
    });

    it("should return boards", async () => {
      const res = await request(httpServer)
        .get("/api/board/")
        .set({ Authorization: "Bearer " + tokenCreator });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].numberOfPlayers).toBe(2);
      expect(res.body.data[0].startedBy._id).toBe(String(userCreator._id));
      expect(res.body.data[0].against._id).toBe(String(userPlayer._id));
    });

    it("should accept legal moves correctly", async () => {
      let res = await request(httpServer)
        .put("/api/board/move/" + board._id)
        .set({ Authorization: "Bearer " + tokenPlayer })
        .send({ index: 1 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Move made on 1");
      expect(res.body.data.board.grid[0]).toBe("X");
      expect(res.body.data.board.currentMark).toBe("O");

      res = await request(httpServer)
        .put("/api/board/move/" + board._id)
        .set({ Authorization: "Bearer " + tokenCreator })
        .send({ index: 2 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Move made on 2");
      expect(res.body.data.board.grid[1]).toBe("O");
      expect(res.body.data.board.currentMark).toBe("X");
    });

    it("should not accept illegal moves", async () => {
      let res = await request(httpServer)
        .put("/api/board/move/" + board._id)
        .set({ Authorization: "Bearer " + tokenCreator })
        .send({ index: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Illegal move - Out of turn");

      res = await request(httpServer)
        .put("/api/board/move/" + board._id)
        .set({ Authorization: "Bearer " + tokenPlayer })
        .send({ index: 1 });

      res = await request(httpServer)
        .put("/api/board/move/" + board._id)
        .set({ Authorization: "Bearer " + tokenPlayer })
        .send({ index: 2 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Illegal move - Out of turn");

      res = await request(httpServer)
        .put("/api/board/move/" + board._id)
        .set({ Authorization: "Bearer " + tokenCreator })
        .send({ index: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Illegal move - Not allowed");
    });

    it("self boards", async () => {
      const res = await request(httpServer)
        .get("/api/board/my")
        .set({ Authorization: "Bearer " + tokenCreator });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("self returns correct board", async () => {
      const res = await request(httpServer)
        .get("/api/board/" + board._id)
        .set({ Authorization: "Bearer " + tokenCreator });

      console.log(board._id);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Board information");
      expect(res.body.data.board.startedBy).toBe(String(userCreator._id));
      expect(res.body.data.board.against).toBe(String(userPlayer._id));
      expect(res.body.data.board.numberOfPlayers).toBe(2);
      expect(res.body.data.board.grid).toHaveLength(9);
    });
  });
});
