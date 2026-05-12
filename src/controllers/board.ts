import type { Response, Request } from "express";
import { WebScoketHelper } from "../lib/ws";
import { BoardService } from "../services/board";
import { catchAsync } from "../middlewares/globalErrors";

export class BoardController {
  private readonly svc = new BoardService();

  start = catchAsync(async (req: Request, res: Response) => {
    const board = await this.svc.createBoard(req.userId!);
    return res.respond("Board created", 201, board);
  });

  join = catchAsync(async (req: Request, res: Response) => {
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

    return res.respond("Joined board", 200, { status });
  });

  myBoards = catchAsync(async (req: Request, res: Response) => {
    const boards = await this.svc.myBoards(req.userId!);
    return res.respond("Users boards", 200, boards);
  });

  getByID = catchAsync(async (req: Request, res: Response) => {
    const dbBoard = await this.svc.getById(req.params.id as string);
    return res.respond("Board information", 200, { board: dbBoard });
  });

  move = catchAsync(async (req: Request, res: Response) => {
    const moveIndex = req.body.index;
    const { board, complete } = await this.svc.move(
      req.params.id as string,
      req.userId!,
      moveIndex,
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

    return res.respond(`Move made on ${moveIndex}`, 200, { board });
  });

  getAll = catchAsync(async (_req: Request, res: Response) => {
    const boards = await this.svc.listAll();
    return res.respond("All boards", 200, boards);
  });

  my = catchAsync(async (req: Request, res: Response) => {
    const boards = await this.svc.selfBoard(req.userId!);
    return res.respond("Users boards", 200, boards);
  });
}
