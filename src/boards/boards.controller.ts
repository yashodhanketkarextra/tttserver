import { Request, Req, Controller, Get, HttpCode, HttpStatus, Put, Param, Body } from "@nestjs/common";
import { BoardsService } from "./boards.service";
import { BoardGateway } from "./board.gateway";

@Controller("api/board")
export class BoardController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly boardGateway: BoardGateway,
  ) {}

  @Get("/new")
  @HttpCode(HttpStatus.CREATED)
  async start(@Request() req: Request) {
    const board = await this.boardsService.createBoard((req as any).userId as string);
    this.boardGateway.server.emit("boardCreated", { message: "New board created", boardId: board.id });

    return {
      _message: "Board created",
      board: board.toObject(),
    };
  }

  @Put("/saved/:id")
  @HttpCode(HttpStatus.OK)
  async join(@Req() req: Request, @Param("id") id: string, @Body() data: any) {
    const { status, joined } = await this.boardsService.joinBoard(id, (req as any).userId as string, data.key);

    if (joined) {
      this.boardGateway.server.emit("playerJoined", { id: id, message: "Player two joined" });
    }

    return {
      _message: "Joined board",
      status: status!,
    };
  }

  @Get("/")
  @HttpCode(HttpStatus.OK)
  async getAll() {
    const boards = await this.boardsService.listAll();
    return {
      _message: "All boards",
      ...boards,
    };
  }

  @Get("/my")
  @HttpCode(HttpStatus.OK)
  async my(@Req() req: Request) {
    const boards = await this.boardsService.selfBoard((req as any).userId as string);
    return {
      _message: "Users boards",
      ...boards,
    };
  }

  @Get("/:id")
  @HttpCode(HttpStatus.OK)
  async getById(@Param("id") id: string) {
    const board = await this.boardsService.getById(id);
    return {
      _message: "Board information",
      ...board.toObject(),
    };
  }

  @Put("/move/:id")
  @HttpCode(HttpStatus.OK)
  async move(@Param("id") id: string, @Body() data: any, @Req() req: Request) {
    const moveIndex = data.index;
    const { board, complete } = await this.boardsService.move(id, (req as any).userId as string, moveIndex);

    if (complete) {
      this.boardGateway.server.emit("gameOver", { _id: id, message: "Game over" });
      return;
    }

    this.boardGateway.server.emit("moveMade", {
      _id: id,
      grid: board.grid,
      message: "Move made on " + moveIndex,
    });

    return {
      _message: `Move made on ${moveIndex}`,
      board,
    };
  }
}
