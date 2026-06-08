import { AuthHelper } from "../../../src/lib/auth";
import { UserModel } from "../../../src/model/user";

describe("user lib tests", () => {
  let helper: AuthHelper;

  beforeEach(async () => {
    helper = new AuthHelper();
    await UserModel.create({
      username: "user1",
      password: "password",
    });
  });

  afterEach(() => {
    UserModel.deleteMany();
  });

  it("should return if user is valid", async () => {
    const token = await helper.getToken({
      _id: "1",
      username: "user1",
    });

    expect(token).toBeDefined();
  });

  it("should throw if user is not valid", async () => {
    const invalidUser = { _id: undefined, username: "user1" } as any;
    await expect(helper.getToken(invalidUser)).rejects.toThrow(
      "User not found",
    );
  });
});
