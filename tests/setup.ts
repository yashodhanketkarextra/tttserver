import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: ".env.test" });

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI!);
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
