import { Response } from "express";

export class Responder {
  message: string;
  statusCode: number;
  data: any;

  static send(
    res: Response,
    message: string,
    statusCode: number = 200,
    data: any = null,
  ) {
    return res.status(statusCode).json({
      message,
      data,
    });
  }

  constructor(message: string, statusCode: number, data: any = null) {
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;

    Object.setPrototypeOf(this, Responder.prototype);
  }

  respond = (res: Response) => {
    Responder.send(res, this.message, this.statusCode, this.data);
  };
}
