import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userName?: string;
    }
    interface Response {
      respond(message: string, statusCode?: number, data?: any): void;
    }
  }
}

export {};
