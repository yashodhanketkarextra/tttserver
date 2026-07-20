import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ cors: { origin: "*" } })
export class BoardGateway {
  @WebSocketServer()
  public server: Server;

  handleConnection(client: Socket) {
    console.log(`🟢 Client connected! Socket ID: ${client.id}`);
  }

  // Triggers automatically when React disconnects or closes the tab
  handleDisconnect(client: Socket) {
    console.log(`🔴 Client disconnected. Socket ID: ${client.id}`);
  }
}
