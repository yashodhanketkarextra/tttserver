import { Request, Response } from "express";
import { UserService } from "../services/user";
import { catchAsync } from "../middlewares/globalErrors";

export class UserController {
  private readonly svc = new UserService();

  register = catchAsync(async (req: Request, res: Response) => {
    const user = await this.svc.register(req.body);
    return res.respond("User Created", 201, {
      id: user._id,
      username: user.username,
    });
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const { user, token } = await this.svc.login(req.body);
    return res.respond("User logged in", 200, {
      user: `Welcome ${user.username}`,
      token,
    });
  });

  me = catchAsync(async (req: Request, res: Response) => {
    const user = await this.svc.getById(req.userId!);
    return res.respond("User information", 200, {
      id: user._id,
      username: user.username,
    });
  });

  statsByID = catchAsync(async (req: Request, res: Response) => {
    const stats = await this.svc.gameStats(req.params.id as string);
    return res.respond("User's personal stats", 200, { ...stats });
  });

  stats = catchAsync(async (_req: Request, res: Response) => {
    const users = await this.svc.listStats();
    return res.respond("All users stats", 200, users);
  });
}
