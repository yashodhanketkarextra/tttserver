import { Request, Req, Controller, Get, Post, Body, HttpCode, HttpStatus, Param } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: any) {
    const user = await this.userService.register(createUserDto);
    return {
      _message: "User registered successfully",
      id: user._id,
      username: user.username,
    };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: any) {
    const { user, token } = await this.userService.login(data);

    return {
      _message: "User logged in successfully",
      user: `Welcome ${user.username}`,
      id: user._id,
      token,
    };
  }

  @Get("me")
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: Request) {
    const user = await this.userService.getById((req as any).userId);
    return {
      _message: "User information",
      id: user._id,
      username: user.username,
    };
  }

  @Get("stats/:id")
  @HttpCode(HttpStatus.OK)
  async stats(@Param("id") id: string) {
    const stats = await this.userService.gameStats(id);
    return {
      _message: "User's personal stats",
      ...stats,
    };
  }

  @Get("stats")
  @HttpCode(HttpStatus.OK)
  async statsById() {
    const users = await this.userService.listStats();
    return {
      _message: "All users stats",
      ...users,
    };
  }

  @Get("")
  @HttpCode(HttpStatus.OK)
  async sanity() {
    return {
      _message: "Sanity check",
      status: "ok",
    };
  }
}
