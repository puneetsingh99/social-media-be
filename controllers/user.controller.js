const { User } = require("../models/user.model");
const { Post } = require("../models/post.model");
const cloudinary = require("cloudinary").v2;
const { successResponse, errorResponse } = require("../utils");
const { extend } = require("lodash");

cloudinary.config({
  cloud_name: process.env["CLOUD_NAME"],
  api_key: process.env["API_KEY"],
  api_secret: process.env["API_SECRET"],
});

const getAllUser = async (req, res) => {
  try {
    const users = await User.find({}).select("-__v -password");

    return successResponse(res, {
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    return errorResponse(res, "Could not retrieve users", error);
  }
};

//TODO:disable delete route and make update route protected

const deleteAllUser = async (req, res) => {
  try {
    await User.deleteMany({});
    return successResponse(res, { message: "Users deleted successfully" });
  } catch (error) {
    return errorResponse(res, "Could not delete the users", error);
  }
};

const userIdCheck = async (req, res, next, userId) => {
  try {
    const user = await User.findOne({ _id: userId })
      .populate(
        "followers following notifications.from",
        "_id username firstname lastname"
      )
      .select("-password  -__v");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    req.userId = userId;
    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Could not retrieve user", error);
  }
};

const getUser = async (req, res) => {
  const { user } = req;
  return successResponse(res, { message: "User retrieved successfully", user });
};

const updateUser = async (req, res) => {
  try {
    const updateData = req.body;

    let userToBeUpdated = await User.findOne({ _id: req.userId });
    userToBeUpdated = extend(userToBeUpdated, updateData);
    const updatedUser = await userToBeUpdated.save();
    updatedUser.__v = undefined;
    updatedUser.password = undefined;

    return successResponse(res, {
      message: "User updated successfully",
      updatedUser,
    });
  } catch (error) {
    return errorResponse(res, "Could not update the user", error);
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.deleteOne({ _id: req.userId });
    return successResponse(res, {
      message: "User deleted successfully",
    });
  } catch (error) {
    return errorResponse(res, "Could not delete the user", error);
  }
};

const addFollower = async (req, res) => {
  try {
    const { followerId } = req.body;
    const userId = req.userId;

    if (userId === followerId) {
      return errorResponse(res, "Cannot follow this user", {
        message: "trying to follow yourself",
      });
    }

    const user = await User.findOne({ _id: userId });

    const alreadyAFollower = user.followers.find(
      (follower) => follower._id === followerId
    );

    if (alreadyAFollower) {
      return errorResponse(res, "Could not add the follower", {
        message: "You are already following this person",
      });
    }

    user.followers.unshift(followerId);
    user.notifications.unshift({ from: followerId, type: "follow" });

    await user.save();

    const followingUser = await User.findOne({ _id: followerId });
    followingUser.following.unshift(userId);
    await followingUser.save();

    return successResponse(res, {
      message: "follower added successfully",
    });
  } catch (error) {
    return errorResponse(res, "Could not add the follower", error);
  }
};

const updateProfilePic = async (req, res) => {
  try {
    const file = req.files.profilePic;

    if (!file) {
      return errorResponse(res, "could not update the profile pic", {
        message: "file not found",
      });
    }

    const userId = req.userId;
    let profilePic = "";

    const fileType = file.mimetype.split("/")[0];
    const allowedFileTypes = ["image"];

    if (!allowedFileTypes.includes(fileType)) {
      return errorResponse(res, "could not update profile pic", {
        message: "invalid file type",
      });
    }

    await cloudinary.uploader.upload(
      file.tempFilePath,
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          return errorResponse(res, "could not update the profile pic", error);
        }

        if (fileType === "image") {
          profilePic = result.secure_url;
        }
      }
    );

    const user = await User.findOne({ _id: userId });

    user.profilePic = profilePic;

    const updatedUser = await user.save();
    const { _id, username } = updatedUser;

    return successResponse(res, {
      message: "Profile pic updated successfully",
      updatedUser: { _id, username, profilePic: updatedUser.profilePic },
    });
  } catch (error) {
    return errorResponse(res, "Could not update the profile picture", error);
  }
};

const updateCoverPic = async (req, res) => {
  try {
    const file = req.files.coverPic;

    if (!file) {
      return errorResponse(res, "could not update the cover pic", {
        message: "file not found",
      });
    }

    const userId = req.userId;
    let coverPic = "";

    const fileType = file.mimetype.split("/")[0];
    const allowedFileTypes = ["image"];

    if (!allowedFileTypes.includes(fileType)) {
      return errorResponse(res, "could not update cover pic", {
        message: "invalid file type",
      });
    }

    await cloudinary.uploader.upload(
      file.tempFilePath,
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          return errorResponse(res, "could not update the cover pic", error);
        }

        if (fileType === "image") {
          coverPic = result.secure_url;
        }
      }
    );

    const user = await User.findOne({ _id: userId });

    user.coverPic = coverPic;

    const updatedUser = await user.save();
    const { _id, username } = updatedUser;

    return successResponse(res, {
      message: "cover pic updated successfully",
      updatedUser: { _id, username, coverPic: updatedUser.coverPic },
    });
  } catch (error) {
    return errorResponse(res, "Could not update the cover picture", error);
  }
};

const addNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { from, post, type } = req.body;
    const user = await User.findOne({ _id: userId });
    user.notifications.unshift({ from, post, type });
    await user.save();
    return successResponse(res, {
      message: "notification added successfully",
    });
  } catch (error) {
    return errorResponse(res, "Could not add notification", error);
  }
};

const getPostsByUser = async (req, res) => {
  try {
    const userId = req.userId;
    const posts = await Post.find({ author: userId }).populate(
      "author",
      "-__v, -password -notifications -email"
    );
    return successResponse(res, {
      message: "Posts retrieved successfully",
      posts,
    });
  } catch (error) {
    return errorResponse(res, "Could not add notification", error);
  }
};

module.exports = {
  getAllUser,
  deleteAllUser,
  userIdCheck,
  getUser,
  updateUser,
  deleteUser,
  addFollower,
  addNotification,
  updateProfilePic,
  updateCoverPic,
  getPostsByUser,
};
