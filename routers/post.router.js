const express = require("express");
const {
  getAllPosts,
  deleteAllPosts,
  postIdCheck,
  addPost,
  getPost,
  updatePost,
  deletePost,
  likePost,
  commentPost,
} = require("../controllers/post.controller");

const { verifyAuth } = require("../middlewares/verify-auth.middleware");

const postRouter = express.Router();

postRouter.route("/").get(getAllPosts).post(addPost).delete(deleteAllPosts);

postRouter.use(verifyAuth);

postRouter.param("postId", postIdCheck);

postRouter.route("/:postId").get(getPost).post(updatePost).delete(deletePost);
postRouter.route("/:postId/like").post(likePost);
postRouter.route("/:postId/comment").post(commentPost);

module.exports = { postRouter };
