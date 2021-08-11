const { Post } = require("../models/post.model");
const { User } = require("../models/user.model");
const cloudinary = require("cloudinary").v2;
const { successResponse, errorResponse } = require("../utils");
const { extend } = require("lodash");

cloudinary.config({
  cloud_name: process.env["CLOUD_NAME"],
  api_key: process.env["API_KEY"],
  api_secret: process.env["API_SECRET"],
});

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({}).populate(
      "author comments.madeBy likes.likedBy",
      "-email -password -__v"
    );

    return successResponse(res, {
      message: "Posts retrieved successfully",
      posts,
    });
  } catch (error) {
    return errorResponse(res, "Could not retrieve posts", error);
  }
};

//TODO:disable delete route and make update route protected
const deleteAllPosts = async (req, res) => {
  try {
    await Post.deleteMany({});
    return successResponse(res, { message: "Posts deleted successfully" });
  } catch (error) {
    return errorResponse(res, "Could not delete the users", error);
  }
};

const addPost = async (req, res) => {
  try {
    const post = req.body;
    let file = null;
    if (req.files) {
      file = req.files.photoOrVideo;
    }

    let image = "";
    let video = "";

    if (file) {
      const fileType = file.mimetype.split("/")[0];
      const allowedFileTypes = ["image", "video"];

      if (!allowedFileTypes.includes(fileType)) {
        return errorResponse(res, "could not add the post", {
          message: "invalid file type",
        });
      }

      await cloudinary.uploader.upload(
        file.tempFilePath,
        { resource_type: "auto" },
        (error, result) => {
          if (error) {
            return errorResponse(res, "could not add the post", error);
          }

          if (fileType === "image") {
            image = result.secure_url;
          }

          if (fileType === "video") {
            video = result.secure_url;
          }
        }
      );
    }

    const newPost = new Post(post);

    if (image) {
      newPost.image = image;
      file.tempFilePath = undefined;
    }

    if (video) {
      newPost.video = video;
      file.tempFilePath = undefined;
    }

    let savedPost = await newPost.save();

    savedPost = await savedPost
      .populate("author comments.madeBy likes.likedBy", "-email -password -__v")
      .execPopulate();

    return successResponse(res, {
      message: "post added successfully",
      savedPost,
    });
  } catch (error) {
    return errorResponse(res, "could not add the post", error);
  }
};

const postIdCheck = async (req, res, next, postId) => {
  try {
    const post = await Post.findOne({ _id: postId }).populate(
      "author comments.madeBy likes.likedBy",
      "-email -password -__v"
    );

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    req.postId = postId;
    req.post = post;
    next();
  } catch (error) {
    return errorResponse(res, "Could not retrieve the post", error);
  }
};

const getPost = async (req, res) => {
  try {
    const post = req.post;
    return successResponse(res, {
      message: "post retrieved successfully",
      post,
    });
  } catch (error) {
    return errorResponse(res, "Could not retrieve the post", error);
  }
};

const updatePost = async (req, res) => {
  try {
    const updateData = req.body;

    let postToBeUpdated = await Post.findOne({ _id: req.postId });
    postToBeUpdated = extend(postToBeUpdated, updateData);
    let updatedPost = await postToBeUpdated.save();
    updatedPost = await updatedPost
      .populate("author comments.madeBy likes.likedBy", "-email -password -__v")
      .execPopulate();
    return successResponse(res, {
      message: "Post updated successfully",
      updatedPost,
    });
  } catch (error) {
    return errorResponse(res, "Could not update the post", error);
  }
};

const deletePost = async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.postId });
    return successResponse(res, {
      message: "post deleted successfully",
    });
  } catch (error) {
    return errorResponse(res, "could not delete the post", error);
  }
};

const likePost = async (req, res) => {
  try {
    const postId = req.postId;
    const likedBy = req.body;

    let post = await Post.findById({ _id: postId });

    const alreadyLiked = post.likes.find(
      (like) => String(like.likedBy) === likedBy.likedBy
    );

    if (alreadyLiked) {
      const updatedLikes = post.likes.filter(
        (like) => String(like.likedBy) !== likedBy.likedBy
      );
      post.likes = updatedLikes;
      let updatedPost = await post.save();
      updatedPost = await updatedPost
        .populate(
          "author comments.madeBy likes.likedBy",
          "-email -password -__v"
        )
        .execPopulate();
      return successResponse(res, {
        message: "like removed from the post",
        updatedPost,
      });
    }

    const user = await User.findOne({ _id: post.author });

    user.notifications.unshift({
      from: likedBy.likedBy,
      type: "like",
      post: post,
    });

    post.likes.unshift(likedBy);
    let updatedPost = await post.save();
    updatedPost = await updatedPost
      .populate("author comments.madeBy likes.likedBy", "-email -password -__v")
      .execPopulate();
    await user.save();

    return successResponse(res, {
      message: "like added to the post",
      updatedPost,
    });
  } catch (error) {
    return errorResponse(res, "could not like the post", error);
  }
};

const commentPost = async (req, res) => {
  try {
    const postId = req.postId;
    const comment = req.body;

    let post = await Post.findById({ _id: postId });

    const user = await User.findOne({ _id: post.author });

    user.notifications.unshift({
      from: comment.madeBy,
      type: "comment",
      post,
    });

    post.comments.unshift(comment);
    let updatedPost = await post.save();
    updatedPost = await updatedPost
      .populate("author comments.madeBy likes.likedBy", "-email -password -__v")
      .execPopulate();

    await user.save();

    return successResponse(res, {
      message: "comment added to the post",
      updatedPost,
    });
  } catch (error) {
    return errorResponse(res, "could not add the comment", error);
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body;

    let postToBeUpdated = await Post.findOne({ _id: req.postId });

    postToBeUpdated.comments = postToBeUpdated.comments.filter(
      (c) => String(c._id) !== commentId
    );

    let updatedPost = await postToBeUpdated.save();

    updatedPost = await updatedPost
      .populate("author comments.madeBy likes.likedBy", "-email -password -__v")
      .execPopulate();

    return successResponse(res, {
      message: "Comment deleted successfully",
      updatedPost,
    });
  } catch (error) {
    return errorResponse(res, "Could not delete the comment", error);
  }
};

module.exports = {
  getAllPosts,
  deleteAllPosts,
  postIdCheck,
  addPost,
  getPost,
  updatePost,
  deletePost,
  likePost,
  commentPost,
  deleteComment,
};
