import { Request, Response, NextFunction } from "express";
import { auth } from "../../src/middlewares/auth";
import { AuthHelper } from "../../src/lib/auth";

describe("auth tests", () => {
  const authHelper = new AuthHelper();

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: NextFunction = jest.fn();

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  const createReqWithAuth = (token?: string): Partial<Request> | void => {
    if (!mockReq.headers) return;
    mockReq.headers["authorization"] = "Bearer " + token;
  };

  it("should work correctly", async () => {
    const token = await authHelper.getToken({ _id: "123", username: "user1" });
    createReqWithAuth(token);
    auth(mockReq as Request, mockRes as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockReq.userId).toBe("123");
    expect(mockReq.userName).toBe("user1");
  });

  it("should result in 401 - Access Denied", async () => {
    createReqWithAuth("");
    auth(mockReq as Request, mockRes as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Access denied." });
  });

  it("should result in 401 - Invalid token", async () => {
    createReqWithAuth("invalid");
    auth(mockReq as Request, mockRes as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid token." });
  });
});
