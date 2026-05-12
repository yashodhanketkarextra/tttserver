import { httpServer, mongoConnection } from "./app";
import { PORT, HOST } from "./store";

mongoConnection();
httpServer.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
