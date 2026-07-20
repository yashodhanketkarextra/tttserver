import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mongooseSchema, Types } from 'mongoose';

export type BoardDocument = Board & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Board {
  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'User', required: true })
  startedBy: Types.ObjectId;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'User' })
  against: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  numberOfPlayers: number;

  @Prop({ type: String, default: 1 })
  key: string;

  @Prop({ type: [String], default: () => Array(9).fill('') })
  grid: string[];

  @Prop({ type: String })
  currentMark: string;

  @Prop({ type: Boolean })
  isGameOver: boolean;

  @Prop({ type: Boolean })
  isDraw: boolean;

  @Prop({ type: Boolean })
  hasWinner: boolean;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'User' })
  winner: Types.ObjectId;
}

export const BoardSchema = SchemaFactory.createForClass(Board);
