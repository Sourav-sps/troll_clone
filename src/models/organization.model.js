import mongoose, { Schema } from "mongoose";

const workspace = new Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const Workspace = mongoose.model("Workspace", workspace);
