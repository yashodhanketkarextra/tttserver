import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/error";

export const errMiddlware =
  () =>
  async (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (process.env.NODE_ENV !== "test") {
      console.error(err.message);
    }

    if (err instanceof AppError) return err.handler(res);
    else return res.status(500).json({ message: err.message });
  };

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
