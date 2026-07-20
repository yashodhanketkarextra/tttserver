import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { config } from "./store";
import { UserModule } from "./user/user.module";
import { AuthMiddleware } from "./middlewares/auth";
import { BoardsModule } from "./boards/boards.module";

@Module({
  imports: [MongooseModule.forRoot(config.DB_URI), UserModule, BoardsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: "api/user/*path", method: RequestMethod.GET },
        { path: "api/board/*path", method: RequestMethod.ALL },
      );
  }
}
