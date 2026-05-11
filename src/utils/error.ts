import { Response } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  handler = (res: Response) => {
    console.error(this.message);
    return res.status(this.statusCode).json({ message: this.message });
  };
}
