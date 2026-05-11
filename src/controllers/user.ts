import { Request, Response } from "express";
import { type AuthRequest } from "../middlewares/auth";
import { UserService } from "../services/user";
import { catchAsync } from "../middlewares/globalErrors";

export class UserController {
  private readonly svc = new UserService();

  register = catchAsync(async (req: Request, res: Response) => {
    const user = await this.svc.register(req.body);
    return res
      .status(201)
      .json({ user: user.username, message: "User created" });
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const { user, token } = await this.svc.login(req.body);
    return res.json({ message: `Welcome ${user.username}`, token });
  });

  me = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await this.svc.getById(req.userId!);
    return res.status(200).json({ id: user._id, username: user.username });
  });

  statsByID = catchAsync(async (req: AuthRequest, res: Response) => {
    const { stats } = await this.svc.gameStats(req.userId!);
    return res.status(200).json({ ...stats });
  });

  stats = catchAsync(async (_req: AuthRequest, res: Response) => {
    const users = await this.svc.listStats();
    return res.status(200).json(users);
  });
}
