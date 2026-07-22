import { Test, TestingModule } from "@nestjs/testing";
import { AuthHelper } from "./auth";
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../store", () => ({
  config: { TOKEN: "Lorem_ipsum_dolor_sit" },
}));

describe("Auth helper", () => {
  let provider: AuthHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthHelper],
    }).compile();

    provider = module.get<AuthHelper>(AuthHelper);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });

  describe("verifyPass", () => {
    it("should return true when password matches", async () => {
      (compare as jest.Mock).mockReturnValue(true);

      const result = await provider.verifyPass("password", "hashedPassword");
      expect(result).toBe(true);
      expect(compare).toHaveBeenCalledWith("password", "hashedPassword");
    });

    it("should return false when password do not matches", async () => {
      (compare as jest.Mock).mockReturnValue(false);

      const result = await provider.verifyPass("password", "hashedPassword");
      expect(result).toBe(false);
    });
  });

  describe("getToken", () => {
    it("should return a token", async () => {
      const mockUser = { _id: "123456789", username: "user1" };
      (sign as jest.Mock).mockReturnValue("gen-mock-token");

      const result = await provider.getToken(mockUser);
      expect(result).toBe("gen-mock-token");
      expect(sign).toHaveBeenCalledWith({ _id: "123456789", username: "user1" }, "Lorem_ipsum_dolor_sit", {
        expiresIn: "1d",
      });
    });

    it("should throw an error when data is missing", async () => {
      const result = provider.getToken({
        _id: "",
        username: "user1",
      });

      expect(result).rejects.toThrow("User not found");
    });
  });
});
