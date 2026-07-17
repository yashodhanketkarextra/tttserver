import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorMessage: any = 'Internal server error';

    if (exception instanceof HttpException) {
      const resPayload = exception.getResponse();
      if (typeof resPayload === 'object' && resPayload !== null) {
        errorMessage = (resPayload as any).message || resPayload;
      } else {
        errorMessage = resPayload;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
