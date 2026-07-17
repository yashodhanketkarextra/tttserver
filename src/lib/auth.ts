import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { config } from '../store';
import { Injectable } from '@nestjs/common';
import { User } from './types';

@Injectable()
export class AuthHelper {
  async verifyPass(password: string, dbPassword: string) {
    return compare(password, dbPassword);
  }

  async getToken(user: User) {
    if (!user._id) throw new Error('User not found');
    return sign({ _id: user._id, username: user.username }, config.TOKEN, {
      expiresIn: '1d',
    });
  }
}
