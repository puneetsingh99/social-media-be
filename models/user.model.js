const { Schema, model } = require("mongoose");

const notification = {
  type: {
    type: String,
    trim: true,
    required: [true, "notification type is mandatory"],
  },
  from: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
  },
};

const UserSchema = Schema(
  {
    firstname: {
      type: String,
      trim: true,
      required: [true, "firstname field of the user cannot be empty"],
    },
    lastname: {
      type: String,
      trim: true,
      required: [true, "lastname field of the user cannot be empty"],
    },
    email: {
      type: String,
      trim: true,
      required: [true, "email field of the user cannot be empty"],
    },
    username: {
      type: String,
      trim: true,
      required: [true, "username field of the user cannot be empty"],
      index: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    profilePic: {
      type: String,
      trim: true,
    },
    coverPic: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
      required: [true, "password field of the user cannot be empty"],
    },
    notifications: [notification],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

const User = model("User", UserSchema);

module.exports = { UserSchema, User };
