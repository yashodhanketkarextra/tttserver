import { UserModel } from "../model/user";

export class UserService {
  listUsers = async () => {
    return await UserModel.find();
  };
}
