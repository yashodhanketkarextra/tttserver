import { Test, TestingModule } from "@nestjs/testing";
import { AuthMiddleware } from "./auth";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");
jest.mock("../store", () => ({
  config: { TOKEN: "test-secret-token" },
}));

describe("AuthMiddleware", () => {
  let middleware: AuthMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockNext: NextFunction = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthMiddleware],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);
    mockRequest = { headers: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(middleware).toBeDefined();
  });

  it("should return 401 if not Authorization header is present", () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Access denied." });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if not Authorization header is invalid", () => {
    mockRequest.headers = { authorization: "invalid-token" };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Access denied." });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if verification fails", () => {
    mockRequest.headers = { authorization: "Bearer invalid-token" };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("invalid-token", "test-secret-token");
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Invalid token." });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should attach userId and userName to request", () => {
    mockRequest.headers = { authorization: "Bearer valid-token" };
    const mockUser = { _id: "123456789", username: "user1" };
    (jwt.verify as jest.Mock).mockReturnValue(mockUser);

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret-token");
    expect((mockRequest as any).userId).toBe("123456789");
    expect((mockRequest as any).userName).toBe("user1");
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
