import cors from "cors";
import express, { json } from "express";
import http from "http";
import mongoose from "mongoose";
import morgan from "morgan";
import expressWs from "express-ws";
import BoardRouter from "./routes/board";
import UserRouter from "./routes/user";
import { errMiddlware } from "./middlewares/globalErrors";

import { DB_URI } from "./store";
import { responseMiddleware } from "./middlewares/responder";

const app = express();
export const httpServer = http.createServer(app);

export const wsInstance = expressWs(app, httpServer);
const { app: appWS } = wsInstance;

app.use(json());
app.use(responseMiddleware());

if (process.env.NODE_ENV !== "test") {
  app.use(cors());
  app.use(morgan("dev"));
}

export const mongoConnection = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("Database connected");
  } catch (err) {
    console.error("Dataase connection error: ", err);
  }
};

appWS.ws("/", (ws: any) => {
  ws.on("message", (msg: string) => {
    console.log("WS Received:", msg);

    const clients = wsInstance.getWss().clients;
    clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(`Got ${msg}`);
      }
    });
  });
});

app.use("/api/board", BoardRouter);
app.use("/api/user", UserRouter);

app.use(errMiddlware());
