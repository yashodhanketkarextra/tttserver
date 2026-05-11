import { Types } from "mongoose";
import Board from "tictactoe-board";
import { BoardModel } from "../model/board";
import { UserModel } from "../model/user";
import { AppError } from "../utils/error";

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
    if (board.winningPlayer() === "X") {
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

  async move(
    boardId: string,
    userId: string,
    index: number,
  ): Promise<{ board: BoardStatus; complete: Boolean }> {
    const id = new Types.ObjectId(userId);
    const dbBoard = await BoardModel.findById(boardId);
    if (!dbBoard) throw new Error("Board not found");
    let board = new Board(dbBoard.grid);

    if (board.isPositionTaken(index))
      throw new AppError("Illegal move - Not allowed", 400);

    const mark = board.currentMark();

    if (
      (mark === "X" && !dbBoard.against.equals(id)) ||
      (mark === "O" && !dbBoard.startedBy.equals(id))
    )
      throw new AppError("Illegal move - Out of turn", 400);

    board = board.makeMove(index, mark);
    await BoardModel.findByIdAndUpdate(dbBoard._id, {
      $set: { ...this.boardStatus(board) },
    });

    if (board.hasWinner())
      return await this.handleWinStatus(
        dbBoard._id,
        board,
        dbBoard.startedBy,
        dbBoard.against,
      );

    if (board.isGameDraw())
      return await this.handleDrawStatus(
        dbBoard._id,
        board,
        dbBoard.startedBy,
        dbBoard.against,
      );

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
}
