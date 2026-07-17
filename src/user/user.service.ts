import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthHelper } from '../lib/auth';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly auth: AuthHelper,
  ) {}

  async register(data: any) {
    const exists = await this.userModel
      .countDocuments({
        username: data.username,
      })
      .exec();
    if (exists > 0) throw new ConflictException('Username already exists');
    return await this.userModel.create({ ...data });
  }

  async login(data: any) {
    const user = await this.userModel
      .findOne({
        username: data.username,
      })
      .exec();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const validate = await this.auth.verifyPass(data.password, user.password);
    if (!validate) throw new UnauthorizedException('Invalid credentials');

    const token = await this.auth.getToken({
      _id: String(user._id),
      username: user.username,
    });

    return { user, token };
  }

  async getById(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async gameStats(userId: string) {
    const user = await this.getById(userId);

    const stats = await this.userModel
      .aggregate([
        {
          $match: { _id: user._id },
        },
        {
          $lookup: {
            from: 'boards',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$startedBy', '$$userId'] },
                      { $eq: ['$against', '$$userId'] },
                    ],
                  },
                },
              },
            ],
            as: 'boards',
          },
        },
        {
          $addFields: {
            winRate: {
              $cond: [
                { $gt: ['$played', 0] },
                { $round: [{ $divide: ['$win', '$played'] }, 2] },
                0,
              ],
            },
            lossRate: {
              $cond: [
                { $gt: ['$played', 0] },
                { $round: [{ $divide: ['$loss', '$played'] }, 2] },
                0,
              ],
            },
            drawRate: {
              $cond: [
                { $gt: ['$played', 0] },
                { $round: [{ $divide: ['$draw', '$played'] }, 2] },
                0,
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            username: 1,
            boards: 1,
            games: '$played',
            win: 1,
            winRate: 1,
            loss: 1,
            lossRate: 1,
            draw: 1,
            drawRate: 1,
          },
        },
      ])
      .exec();

    return stats[0] || null;
  }
  async listStats() {
    return await this.userModel.aggregate([
      {
        $addFields: {
          winRate: {
            $cond: [
              { $gt: ['$played', 0] },
              { $round: [{ $divide: ['$win', '$played'] }, 2] },
              0,
            ],
          },
          lossRate: {
            $cond: [
              { $gt: ['$played', 0] },
              { $round: [{ $divide: ['$loss', '$played'] }, 2] },
              0,
            ],
          },
          drawRate: {
            $cond: [
              { $gt: ['$played', 0] },
              { $round: [{ $divide: ['$draw', '$played'] }, 2] },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          boards: 1,
          games: '$played',
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
