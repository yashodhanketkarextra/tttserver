import { httpServer, mongoConnection } from "./app";
import { config } from "./store";

mongoConnection();
httpServer.listen(config.PORT, config.HOST, () => {
  console.log(`Server running at http://${config.HOST}:${config.PORT}`);
});
