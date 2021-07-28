const { Post } = require("../models/post.model");
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
