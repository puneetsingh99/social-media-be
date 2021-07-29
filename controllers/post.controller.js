const { Post } = require("../models/post.model");
const { User } = require("../models/user.model");
const { successResponse, errorResponse } = require("../utils");
const { extend } = require("lodash");

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({}).select("-__v -password");

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
    console.log("post", post);
    const newPost = new Post(post);
    const savedPost = await newPost.save();

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
    const post = await Post.findOne({ _id: postId })
      .populate("author likes.likedBy", "_id username")
      .select("-__v");

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
    const updatedPost = await postToBeUpdated.save();
    updatedPost.__v = undefined;

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
      await post.save();
      return successResponse(res, {
        message: "like removed from the post",
      });
    }

    const user = await User.findOne({ _id: post.author });

    user.notifications.unshift({
      from: likedBy.likedBy,
      type: "like",
      post: post,
    });

    post.likes.unshift(likedBy);
    await post.save();
    await user.save();

    return successResponse(res, {
      message: "like added to the post",
    });
  } catch (error) {
    return errorResponse(res, "could not like the post", error);
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
};
