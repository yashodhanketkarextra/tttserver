import { hash, genSalt } from "bcrypt";
import { model, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    played: {
      type: Number,
      default: 0,
    },
    win: {
      type: Number,
      default: 0,
    },
    loss: {
      type: Number,
      default: 0,
    },
    draw: {
      type: Number,
      default: 0,
    },
    boards: [
      {
        type: Schema.Types.ObjectId,
        ref: "Board",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await hash(this.password, await genSalt(10));
});

export const UserModel = model("User", UserSchema);
