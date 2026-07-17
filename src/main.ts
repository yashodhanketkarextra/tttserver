import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './store';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.enableCors({ origin: '*' });

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(config.PORT);
}
bootstrap();
