import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mongooseSchema } from 'mongoose';
import { hash, genSalt } from 'bcrypt';

export type UserDocument = User & Document;

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ type: String, required: true })
  username: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: Number, default: 0 })
  played: number;

  @Prop({ type: Number, default: 0 })
  win: number;

  @Prop({ type: Number, default: 0 })
  loss: number;

  @Prop({ type: Number, default: 0 })
  draw: number;

  @Prop({
    type: [{ type: mongooseSchema.Types.ObjectId, ref: 'Board' }],
    default: [],
  })
  boards: mongooseSchema.Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await hash(this.password, await genSalt(10));
});
