import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config } from './store';
import { UserModule } from './user/user.module';
import { AuthMiddleware } from './middlewares/auth';

@Module({
  imports: [MongooseModule.forRoot(config.DB_URI), UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({
      path: 'api/users/*path',
      method: RequestMethod.GET,
    });
  }
}
