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

  it("should join board", async () => {
    const board = await svc.createBoard(String(creator._id));
    const res = await svc.joinBoard(String(board._id), String(against._id), board.key);

    expect(res.joined).toBe(true);
    expect(res.status).toBeDefined();
    expect(res.status?.grid).toBeDefined();
    expect(res.status?.currentMark).toBe("X");
  });

  it("should not join board", async () => {});
});
