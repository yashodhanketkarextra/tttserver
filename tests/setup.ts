import mongoose from "mongoose";
import { configureEnv } from "@louriest/envisor";

export const config = configureEnv({ DB_URI: "string", TOKEN: "string" }, { path: ".env.test" });

beforeAll(async () => {
  await mongoose.connect(config.DB_URI);
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(async () => {
  await mongoose.disconnect();
  jest.resetAllMocks();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
