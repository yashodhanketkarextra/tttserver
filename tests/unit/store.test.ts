import { envLoader } from "../../src/store";

describe("store tests", () => {
  it("should return correct environment variable", () => {
    const token = envLoader("TOKEN", String);

    expect(token).toBeDefined();
  });

  it("should raise error while fetching undefined environment variable", () => {
    expect(() => envLoader("UNDEFINED", (val) => val)).toThrow("Missing env variable: UNDEFINED");
  });
});
