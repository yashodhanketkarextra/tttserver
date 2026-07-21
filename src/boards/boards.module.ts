import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Board, BoardSchema } from "./boards.schema";
import { BoardController } from "./boards.controller";
import { BoardsService } from "./boards.service";
import { BoardGateway } from "./board.gateway";
import { UserSchema, User } from "src/user/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardsService, BoardGateway],
})
export class BoardsModule {}
