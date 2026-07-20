import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Board, BoardDocument } from "./boards.schema";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "src/user/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import TTTBoard from "src/lib/board";
import crypto from "crypto";

export interface BoardStatus {
  grid: string[];
  currentMark: string;
  isDraw: boolean;
  hasWinner: boolean;
  isGameOver: boolean;
}

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private boardStatus(board: TTTBoard): BoardStatus {
    return {
      grid: board.grid,
      currentMark: board.currentMark(),
      isDraw: board.isGameDraw(),
      hasWinner: board.hasWinner(),
      isGameOver: board.isGameOver(),
    };
  }

  private async addWin(id: Types.ObjectId) {
    await this.userModel
      .findByIdAndUpdate(id, {
        $inc: { win: 1, played: 1 },
      })
      .exec();
  }

  private async addLoss(id: Types.ObjectId) {
    await this.userModel
      .findByIdAndUpdate(id, {
        $inc: { loss: 1, played: 1 },
      })
      .exec();
  }

  private async addDraw(id: Types.ObjectId) {
    await this.userModel
      .findByIdAndUpdate(id, {
        $inc: { draw: 1, played: 1 },
      })
      .exec();
  }

  private async handleWinStatus(
    id: Types.ObjectId,
    board: TTTBoard,
    startedBy: Types.ObjectId,
    against: Types.ObjectId,
  ): Promise<{ board: BoardStatus; complete: boolean }> {
    if (board.winningPlayer() === "O") {
      await this.addWin(startedBy);
      await this.addLoss(against);
      await this.boardModel
        .findByIdAndUpdate(id, {
          $set: { winner: startedBy, isGameOver: true },
        })
        .exec();
    } else {
      await this.addLoss(startedBy);
      await this.addWin(against);
      await this.boardModel
        .findByIdAndUpdate(id, {
          $set: { winner: against, isGameOver: true },
        })
        .exec();
    }
    return { board: this.boardStatus(board), complete: true };
  }

  private async handleDrawStatus(
    id: Types.ObjectId,
    board: TTTBoard,
    startedBy: Types.ObjectId,
    against: Types.ObjectId,
  ): Promise<{ board: BoardStatus; complete: boolean }> {
    await Promise.all([startedBy, against].map((p) => this.addDraw(p)));

    await this.boardModel
      .findByIdAndUpdate(id, {
        $set: { isDraw: true, isGameOver: true },
      })
      .exec();

    return { board: this.boardStatus(board), complete: true };
  }

  async move(boardId: string, userId: string, index: number): Promise<{ board: BoardStatus; complete: boolean }> {
    const id = new Types.ObjectId(userId);
    const dbBoard = await this.boardModel.findById(boardId).exec();
    if (!dbBoard) throw new Error("Board not found");
    let board = new TTTBoard(dbBoard.grid);

    if (board.isPositionTaken(index)) throw new BadRequestException("Illegal move - Not allowed");

    const mark = board.currentMark();

    if ((mark === "X" && !dbBoard.against.equals(id)) || (mark === "O" && !dbBoard.startedBy.equals(id)))
      throw new BadRequestException("Illegal move - Out of turn");

    board = board.makeMove(index, mark);
    await this.boardModel
      .findByIdAndUpdate(dbBoard._id, {
        $set: { ...this.boardStatus(board) },
      })
      .exec();

    if (board.hasWinner()) return await this.handleWinStatus(dbBoard._id, board, dbBoard.startedBy, dbBoard.against);

    if (board.isGameDraw()) return await this.handleDrawStatus(dbBoard._id, board, dbBoard.startedBy, dbBoard.against);

    return { board: this.boardStatus(board), complete: false };
  }

  async createBoard(startedBy: string) {
    const key = crypto.randomBytes(3).toString("hex");

    const board = new TTTBoard();
    const initialStatus = this.boardStatus(board);

    const newBoard = await this.boardModel.create({
      ...initialStatus,
      startedBy: new Types.ObjectId(startedBy),
      key,
    });

    return newBoard;
  }

  async joinBoard(id: string, userId: string, key: string): Promise<{ status: BoardStatus | null; joined: boolean }> {
    const dbBoard = await this.boardModel.findById(id).exec();
    const player = new Types.ObjectId(userId);
    if (!dbBoard) throw new NotFoundException("Incorrect board number");

    if (key !== dbBoard.key) throw new BadRequestException("Incorrect board key");

    if (!dbBoard.startedBy.equals(player) && !dbBoard.against) {
      await this.boardModel
        .updateOne(dbBoard, {
          against: player,
          numberOfPlayers: Number(dbBoard.numberOfPlayers) + 1,
        })
        .exec();
    }

    const status = this.boardStatus(new TTTBoard(dbBoard.grid));
    return { status, joined: true };
  }

  async getById(id: string) {
    const dbBoard = await this.boardModel.findOne({ _id: id }).exec();
    if (!dbBoard) throw new NotFoundException("Board not found");
    return dbBoard;
  }

  async listAll() {
    const boards = await this.boardModel
      .find()
      .populate("against", "username")
      .populate("startedBy", "username")
      .populate("winner", "username")
      .exec();

    return boards;
  }

  async selfBoard(userId: string) {
    const id = new Types.ObjectId(userId);
    const boards = await this.boardModel
      .find({
        $or: [{ against: id }, { startedBy: id }],
      })
      .exec();

    return boards;
  }
}
