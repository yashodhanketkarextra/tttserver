import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../store";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied." });

  try {
    const decoded = jwt.verify(token, config.TOKEN) as {
      _id: string;
      username: string;
    };
    req.userId = decoded._id;
    req.userName = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};
