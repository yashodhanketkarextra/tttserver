import { AuthHelper } from "../../../src/lib/auth";
import { UserService } from "../../../src/services/user";
import { UserModel } from "../../../src/model/user";

describe("user services tests", () => {
  let svc: UserService;
  let helper: AuthHelper;

  beforeAll(async () => {
    svc = new UserService();
    helper = new AuthHelper();
  });

  beforeEach(async () => {
    await UserModel.create({
      username: "user1",
      password: "password",
    });
  });

  afterEach(async () => {
    await UserModel.deleteMany();
  });

  it("should return all users", async () => {
    const listUsers = await svc.listUsers();

    expect(listUsers.length).toBe(1);
  });
});
