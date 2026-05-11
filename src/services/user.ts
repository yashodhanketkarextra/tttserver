import { getToken, hashPass, verifyPass } from "../auth";
import { UserModel } from "../model/user";
import { AppError } from "../utils/error";
import { Types } from "mongoose";

export class UserService {
  listUsers = async () => {
    return await UserModel.find();
  };

  async register(data: any) {
    const user = await UserModel.create({
      ...data,
      password: await hashPass(data.password),
    });

    return user;
  }

  async login(data: any) {
    const user = await UserModel.findOne({ username: data.username });
    if (!user) throw new AppError("Invalid credentials", 401);

    const validate = await verifyPass(data.password, user.password);
    if (!validate) throw new AppError("Invalid credentials", 401);

    const token = await getToken({
      _id: String(user._id),
      username: user.username,
    });

    return { user, token };
  }

  async getById(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  async gameStats(userId: string) {
    const stats = await UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "boards",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$startedBy", "$$userId"] },
                    { $eq: ["$against", "$$userId"] },
                  ],
                },
              },
            },
            { $limit: 20 },
            { $sort: { createdAt: -1 } },
          ],
          as: "boards",
        },
      },
      {
        $addFields: {
          winRate: {
            $cond: [
              { $gt: ["$played", 0] },
              { $round: [{ $divide: ["$win", "$played"] }, 2] },
              0,
            ],
          },
          lossRate: {
            $cond: [
              { $gt: ["$played", 0] },
              { $round: [{ $divide: ["$loss", "$played"] }, 2] },
              0,
            ],
          },
          drawRate: {
            $cond: [
              { $gt: ["$played", 0] },
              { $round: [{ $divide: ["$draw", "$played"] }, 2] },
              0,
            ],
          },
        },
      },
    ]);

    return stats[0] || null;
  }

  async listStats() {
    return await UserModel.aggregate([
      {
        $addFields: {
          winRate: {
            $cond: [
              { $gt: ["$played", 0] },
              { $round: [{ $divide: ["$win", "$played"] }, 2] },
              0,
            ],
          },
          lossRate: {
            $cond: [
              { $gt: ["$played", 0] },
              { $round: [{ $divide: ["$loss", "$played"] }, 2] },
              0,
            ],
          },
          drawRate: {
            $cond: [
              { $gt: ["$played", 0] },
              { $round: [{ $divide: ["$draw", "$played"] }, 2] },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          games: "$played",
          win: 1,
          winRate: 1,
          loss: 1,
          lossRate: 1,
          draw: 1,
          drawRate: 1,
        },
      },
      { $sort: { winRate: -1 } },
    ]);
  }
}
