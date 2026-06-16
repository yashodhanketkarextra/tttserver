import { UserModel } from "../../../src/model/user";
import bcrypt from "bcrypt";

describe("user model tests", () => {
  it("should hash password", async () => {
    const plainPassword = "password";
    const user = new UserModel({
      username: "user_hash",
      password: plainPassword,
    });

    await user.save();

    expect(user.password).not.toBe(plainPassword);
    expect(user.password.startsWith("$2b$")).toBe(true);

    const isMatch = await bcrypt.compare(plainPassword, user.password);
    expect(isMatch).toBe(true);
  });

  it("should re-hash the password on modification", async () => {
    const user = new UserModel({
      username: "user_update",
      password: "password",
    });
    await user.save();

    const plainPassword = "new_password";
    user.password = plainPassword;
    await user.save();

    expect(user.password).not.toBe(plainPassword);
    expect(user.password.startsWith("$2b$")).toBe(true);
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    expect(isMatch).toBe(true);
  });

  it("should not re-hash the password on modification if not modified", async () => {
    const user = new UserModel({
      username: "user_name",
      password: "password",
    });
    await user.save();

    user.username = "user_name_update";
    await user.save();

    expect(user.password).not.toBe("password");
    expect(user.password.startsWith("$2b$")).toBe(true);
    const isMatch = await bcrypt.compare("password", user.password);
    expect(isMatch).toBe(true);
  });
});
