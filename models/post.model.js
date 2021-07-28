const { Schema, model } = require("mongoose");

const CommentSchema = new Schema(
  {
    content: {
      type: String,
      trim: true,
      required: [true, "comment cannot be empty"],
    },
    madeBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "author is required to make comment"],
    },
  },
  {
    timestamps: true,
  }
);

const LikeSchema = new Schema(
  {
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required to like a post"],
    },
  },
  {
    timestamps: true,
  }
);

const PostSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    content: {
      type: String,
      required: [true, "content cannot be empty"],
    },
    image: {
      type: String,
    },
    likes: [LikeSchema],
    comments: [CommentSchema],
  },
  {
    timestamps: true,
  }
);

const Post = new model("Post", PostSchema);
module.exports = { Post };
