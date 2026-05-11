import { type Response } from "express";
import { type AuthRequest } from "../middlewares/auth";
import Board from "tictactoe-board";
import { WebScoketHelper } from "../helpers/ws";
import { BoardModel } from "../model/board";
import { Types } from "mongoose";
import { BoardService } from "../services/board";
import { catchAsync } from "../middlewares/globalErrors";

const boardStatus = (board: Board) => {
  return {
    grid: board.grid,
    currentMark: board.currentMark(),
    isDraw: board.isGameDraw(),
    hasWinner: board.hasWinner(),
    isGameOver: board.isGameOver(),
  };
};

export class BoardController {
  private readonly svc = new BoardService();

  start = async (req: AuthRequest, res: Response) => {
    try {
      const board = await this.svc.createBoard(req.userId!);
      return res.status(201).json(board);
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  };

  join = async (req: AuthRequest, res: Response) => {
    const id = new Types.ObjectId(req.params.id as string);
    const userId = new Types.ObjectId(req.userId);
    const { key } = req.body;
    const dbBoard = await BoardModel.findById(id);
    if (!dbBoard)
      return res.status(404).json({ message: "Incorrect board number" }).end();
    if (key !== dbBoard.key) return res.status(500).end();
    if (
      dbBoard.startedBy.toString() !== userId.toString() &&
      !dbBoard.against
    ) {
      await BoardModel.findByIdAndUpdate(id, {
        $set: { against: userId },
        $inc: { numberOfPlayers: 1 },
      });
      await WebScoketHelper.sender(
        JSON.stringify({
          message: "Player two joined",
        }),
      );
    }
    const board = new Board(dbBoard.grid);
    return res.status(201).json({
      status: boardStatus(board),
    });
  };

  myBoards = async (req: AuthRequest, res: Response) => {
    const id = new Types.ObjectId(req.userId);
    const boards = (
      await BoardModel.find({
        $or: [{ against: id }, { startedBy: id }],
      })
    )
      .filter((ele) => ele.isDraw === false && ele.hasWinner === false)
      .map((ele) => ele._id);
    return res.json(boards);
  };

  getByID = async (req: AuthRequest, res: Response) => {
    try {
      const id = new Types.ObjectId(req.params.id as string);
      const dbBoard = await BoardModel.findOne({ _id: id });
      if (dbBoard) return res.status(200).json(dbBoard);
      else return res.status(404).end();
    } catch (err) {
      return res.status(500).end();
    }
  };

  move = catchAsync(async (req: AuthRequest, res: Response) => {
    const { board, complete } = await this.svc.move(
      req.params.id as string,
      req.userId!,
      req.body.index,
    );

    if (complete) {
      await WebScoketHelper.sender(JSON.stringify({ status: board }));
      return;
    }

    await WebScoketHelper.sender(
      JSON.stringify({
        _id: req.params.id,
        grid: board.grid,
      }),
    );

    return res.status(200).json(board);
  });

  getAll = async (_req: AuthRequest, res: Response) => {
    const boards = await BoardModel.find()
      .populate("against", "username")
      .populate("startedBy", "username")
      .populate("winner", "username");
    return res.status(200).json([...boards]);
  };

  my = async (req: AuthRequest, res: Response) => {
    const id = new Types.ObjectId(req.userId);
    const boards = await BoardModel.find({
      $or: [{ against: id }, { startedBy: id }],
    });
    return res.status(200).json({ boards });
  };
}
