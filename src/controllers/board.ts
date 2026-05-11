import { type Response } from "express";
import { type AuthRequest } from "../middlewares/auth";
import { WebScoketHelper } from "../helpers/ws";
import { BoardService } from "../services/board";
import { catchAsync } from "../middlewares/globalErrors";

export class BoardController {
  private readonly svc = new BoardService();

  start = catchAsync(async (req: AuthRequest, res: Response) => {
    const board = await this.svc.createBoard(req.userId!);
    return res.status(201).json(board);
  });

  join = catchAsync(async (req: AuthRequest, res: Response) => {
    const { status, joined } = await this.svc.joinBoard(
      req.params.id as string,
      req.userId!,
      req.body.key,
    );

    if (joined) {
      await WebScoketHelper.sender(
        JSON.stringify({ message: "Player two joined" }),
      );
    }

    return res.status(200).json({ status });
  });

  myBoards = catchAsync(async (req: AuthRequest, res: Response) => {
    const boards = await this.svc.myBoards(req.userId!);
    return res.json(boards);
  });

  getByID = catchAsync(async (req: AuthRequest, res: Response) => {
    const dbBoard = await this.svc.getById(req.params.id as string);
    return res.status(200).json(dbBoard);
  });

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

  getAll = catchAsync(async (_req: AuthRequest, res: Response) => {
    const boards = await this.svc.listAll();
    return res.status(200).json([...boards]);
  });

  my = catchAsync(async (req: AuthRequest, res: Response) => {
    const boards = await this.svc.selfBoard(req.userId!);
    return res.status(200).json({ boards });
  });
}
