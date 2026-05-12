import { NextFunction, Request, Response } from "express";

export const responseMiddleware =
  () => (_req: Request, res: Response, next: NextFunction) => {
    res.respond = (
      message: string,
      statusCode: number = 200,
      data: any = null,
    ) => {
      return res.status(statusCode).json({
        message,
        data,
      });
    };

    next();
  };
