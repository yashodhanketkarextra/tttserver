import mongoose from "mongoose";
import { UserModel } from "../../../src/model/user";
import { BoardService } from "../../../src/services/board";

describe("board services tests", () => {
  let creator: InstanceType<typeof UserModel>;
  let against: InstanceType<typeof UserModel>;
  let svc = new BoardService();

  beforeEach(async () => {
    creator = await UserModel.create({
      username: "user1",
      password: "password",
    });

    against = await UserModel.create({
      username: "user2",
      password: "password",
    });
  });

  it("should create board", async () => {
    const board = await svc.createBoard(String(creator._id));

    expect(board.startedBy).toStrictEqual(creator._id);
    expect(board.numberOfPlayers).toBe(1);
    expect(board.key).toBeDefined();
    expect(board.against).not.toBeDefined();
  });

  it("should return correct board", async () => {
    const id = (await svc.createBoard(String(creator._id)))._id;
    const board = await svc.getById(String(id));

    expect(board.startedBy).toStrictEqual(creator._id);
    expect(board.numberOfPlayers).toBe(1);
    expect(board.key).toBeDefined();
    expect(board.against).not.toBeDefined();
  });

  it("should join board", async () => {
    const board = await svc.createBoard(String(creator._id));
    const res = await svc.joinBoard(String(board._id), String(against._id), board.key);

    expect(res.joined).toBe(true);
    expect(res.status).toBeDefined();
    expect(res.status?.grid).toBeDefined();
    expect(res.status?.currentMark).toBe("X");
  });

  it("should not join board - Incorrect board id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    expect(async () => await svc.joinBoard(fakeId, String(against._id), "abcde")).rejects.toThrow(
      "Incorrect board number",
    );
  });

  it("should not join board - Incorrect board key", async () => {
    const board = await svc.createBoard(String(creator._id));
    expect(async () => await svc.joinBoard(String(board._id), String(against._id), "abcde")).rejects.toThrow(
      "Incorrect board key",
    );
  });

  it("should not make moves - win achived", async () => {
    let board = await svc.createBoard(String(creator._id));
    await svc.joinBoard(String(board._id), String(against._id), board.key);

    board.grid = ["X", "X", "", "O", "O", "", "", "", ""];
    await board.save();

    await svc.move(String(board._id), String(against._id), 3);
    board = await svc.getById(String(board._id));

    expect(board.hasWinner).toBe(true);
    expect(board.winner).toEqual(against._id);
    expect(board.isGameOver).toBe(true);
  });

  it("should not make moves - draw achived", async () => {
    let board = await svc.createBoard(String(creator._id));
    await svc.joinBoard(String(board._id), String(against._id), board.key);

    board.grid = ["X", "O", "X", "O", "X", "X", "O", "", "O"];
    await board.save();

    await svc.move(String(board._id), String(against._id), 8);
    board = await svc.getById(String(board._id));

    expect(board.hasWinner).toBe(false);
    expect(board.isDraw).toBe(true);
    expect(board.isGameOver).toBe(true);
  });
});
