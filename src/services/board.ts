import { Types } from "mongoose";
import Board from "../lib/board";
import { BoardModel } from "../model/board";
import { UserModel } from "../model/user";
import { AppError } from "../lib/error";

interface BoardStatus {
  grid: string[];
  currentMark: string;
  isDraw: boolean;
  hasWinner: boolean;
  isGameOver: boolean;
}

export class BoardService {
  private boardStatus(board: Board): BoardStatus {
    return {
      grid: board.grid,
      currentMark: board.currentMark(),
      isDraw: board.isGameDraw(),
      hasWinner: board.hasWinner(),
      isGameOver: board.isGameOver(),
    };
  }

  private async addWin(player?: unknown) {
    await UserModel.findByIdAndUpdate(player, { $inc: { win: 1, played: 1 } });
  }

  private async addLoss(player: unknown) {
    await UserModel.findByIdAndUpdate(player, { $inc: { loss: 1, played: 1 } });
  }

  private async addDraw(player: unknown) {
    await UserModel.findByIdAndUpdate(player, { $inc: { draw: 1, played: 1 } });
  }

  private async handleWinStatus(
    id: Types.ObjectId,
    board: Board,
    startedBy: Types.ObjectId,
    against: Types.ObjectId,
  ): Promise<{ board: BoardStatus; complete: Boolean }> {
    if (board.winningPlayer() === "O") {
      await this.addWin(startedBy);
      await this.addLoss(against);
      await BoardModel.findByIdAndUpdate(id, {
        $set: { winner: startedBy, isGameOver: true },
      });
    } else {
      await this.addLoss(startedBy);
      await this.addWin(against);
      await BoardModel.findByIdAndUpdate(id, {
        $set: { winner: against, isGameOver: true },
      });
    }
    return { board: this.boardStatus(board), complete: true };
  }

  private async handleDrawStatus(
    id: Types.ObjectId,
    board: Board,
    startedBy: Types.ObjectId,
    against: Types.ObjectId,
  ): Promise<{ board: BoardStatus; complete: Boolean }> {
    [startedBy, against].forEach((p) => this.addDraw(p));
    await BoardModel.findByIdAndUpdate(id, {
      $set: { isDraw: true, isGameOver: true },
    });
    return { board: this.boardStatus(board), complete: true };
  }

  async move(boardId: string, userId: string, index: number): Promise<{ board: BoardStatus; complete: Boolean }> {
    const id = new Types.ObjectId(userId);
    const dbBoard = await BoardModel.findById(boardId);
    if (!dbBoard) throw new Error("Board not found");
    let board = new Board(dbBoard.grid);

    if (board.isPositionTaken(index)) throw new AppError("Illegal move - Not allowed", 400);

    const mark = board.currentMark();

    if ((mark === "X" && !dbBoard.against.equals(id)) || (mark === "O" && !dbBoard.startedBy.equals(id)))
      throw new AppError("Illegal move - Out of turn", 400);

    board = board.makeMove(index, mark);
    await BoardModel.findByIdAndUpdate(dbBoard._id, {
      $set: { ...this.boardStatus(board) },
    });

    if (board.hasWinner()) return await this.handleWinStatus(dbBoard._id, board, dbBoard.startedBy, dbBoard.against);

    if (board.isGameDraw()) return await this.handleDrawStatus(dbBoard._id, board, dbBoard.startedBy, dbBoard.against);

    return { board: this.boardStatus(board), complete: false };
  }

  async createBoard(startedBy: string) {
    const key = Math.random().toString(36).substring(2, 7);

    const board = new Board();
    const initialStatus = this.boardStatus(board);

    const newBoard = await BoardModel.create({
      ...initialStatus,
      startedBy: new Types.ObjectId(startedBy),
      key,
    });

    return newBoard;
  }

  async joinBoard(id: string, userId: string, key: string): Promise<{ status: BoardStatus | null; joined: Boolean }> {
    const dbBoard = await BoardModel.findById(id);
    const player = new Types.ObjectId(userId);
    if (!dbBoard) throw new AppError("Incorrect board number", 404);
    if (key !== dbBoard.key) throw new AppError("Incorrect board key", 400);

    if (!dbBoard.startedBy.equals(player) && !dbBoard.against) {
      await BoardModel.updateOne(dbBoard, {
        against: player,
        numberOfPlayers: Number(dbBoard.numberOfPlayers) + 1,
      });
    }

    const status = this.boardStatus(new Board(dbBoard.grid));
    return { status, joined: true };
  }

  async myBoards(userId: string) {
    const id = new Types.ObjectId(userId);
    const boards = (
      await BoardModel.find({
        $or: [{ against: id }, { startedBy: id }],
      })
    )
      .filter((ele) => ele.isDraw === false && ele.hasWinner === false)
      .map((ele) => ele._id);
    return boards;
  }

  async getById(id: string) {
    const dbBoard = await BoardModel.findOne({ _id: id });
    if (!dbBoard) throw new AppError("Board not found", 404);
    return dbBoard;
  }

  async listAll() {
    const boards = await BoardModel.find()
      .populate("against", "username")
      .populate("startedBy", "username")
      .populate("winner", "username");

    return boards;
  }

  async selfBoard(userId: string) {
    const id = new Types.ObjectId(userId);
    const boards = await BoardModel.find({
      $or: [{ against: id }, { startedBy: id }],
    });

    return boards;
  }
}
