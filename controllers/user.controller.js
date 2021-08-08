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
    const users = await User.find({}).select("-__v -password -email");

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
        "_id username firstname lastname profilePic followers following"
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
    let newProfilePic = null;
    let newCoverPic = null;
    if (req.files) {
      newProfilePic = req.files.newProfilePic;
      newCoverPic = req.files.newCoverPic;
    }

    let userToBeUpdated = await User.findOne({ _id: req.userId });
    userToBeUpdated = extend(userToBeUpdated, updateData);

    if (newProfilePic) {
      let profilePic = "";
      const fileType = newProfilePic.mimetype.split("/")[0];
      const allowedFileTypes = ["image"];
      if (!allowedFileTypes.includes(fileType)) {
        return errorResponse(res, "could not update profile pic", {
          message: "invalid file type",
        });
      }
      await cloudinary.uploader.upload(
        newProfilePic.tempFilePath,
        { resource_type: "auto" },
        (error, result) => {
          if (error) {
            return errorResponse(
              res,
              "could not update the profile pic",
              error
            );
          }
          if (fileType === "image") {
            profilePic = result.secure_url;
          }
        }
      );
      userToBeUpdated.profilePic = profilePic;
    }

    if (newCoverPic) {
      let coverPic = "";
      const fileType = newCoverPic.mimetype.split("/")[0];
      const allowedFileTypes = ["image"];
      if (!allowedFileTypes.includes(fileType)) {
        return errorResponse(res, "could not update cover pic", {
          message: "invalid file type",
        });
      }
      await cloudinary.uploader.upload(
        newCoverPic.tempFilePath,
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
      userToBeUpdated.coverPic = coverPic;
    }

    let updatedUser = await userToBeUpdated.save();
    updatedUser = await updatedUser
      .populate(
        "followers following notifications.from",
        "_id username firstname lastname profilePic followers following"
      )
      .execPopulate();
    updatedUser.__v = undefined;
    updatedUser.password = undefined;
    updatedUser.email = undefined;

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

const updateFollowers = async (req, res) => {
  try {
    const { loggedInUserId } = req.body;
    const userId = req.userId;

    if (userId === loggedInUserId) {
      return errorResponse(res, "cannot follow this user", {
        message: "cannot follow yourself",
      });
    }

    let user = await User.findOne({ _id: userId });
    let loggedInUser = await User.findOne({ _id: loggedInUserId });

    const alreadyFollows = user.followers.find(
      (user) => String(user._id) === loggedInUserId
    );

    if (alreadyFollows) {
      user.followers = user.followers.filter(
        (user) => String(user._id) !== loggedInUserId
      );
      loggedInUser.following = loggedInUser.following.filter(
        (user) => String(user._id) !== userId
      );

      let updatedUser = await user.save();
      updatedUser = await updatedUser
        .populate(
          "followers following notifications.from",
          "_id username firstname lastname profilePic followers following"
        )
        .execPopulate();
      updatedUser.__v = undefined;
      updatedUser.email = undefined;
      updatedUser.password = undefined;

      let updatedLoggedInUser = await loggedInUser.save();
      updatedLoggedInUser = await updatedLoggedInUser
        .populate(
          "followers following notifications.from",
          "_id username firstname lastname profilePic followers following"
        )
        .execPopulate();
      updatedLoggedInUser.__v = undefined;
      updatedLoggedInUser.email = undefined;
      updatedLoggedInUser.password = undefined;

      return successResponse(res, {
        message: "user unfollowed",
        updatedLoggedInUser,
        updatedUser,
      });
    }

    user.followers.unshift(loggedInUserId);
    user.notifications.unshift({ from: loggedInUserId, type: "follow" });
    loggedInUser.following.unshift(userId);

    let updatedUser = await user.save();
    updatedUser = await updatedUser
      .populate(
        "followers following notifications.from",
        "_id username firstname lastname profilePic followers following"
      )
      .execPopulate();
    updatedUser.__v = undefined;
    updatedUser.email = undefined;
    updatedUser.password = undefined;

    let updatedLoggedInUser = await loggedInUser.save();
    updatedLoggedInUser = await updatedLoggedInUser
      .populate(
        "followers following notifications.from",
        "_id username firstname lastname profilePic followers following"
      )
      .execPopulate();
    updatedLoggedInUser.__v = undefined;
    updatedLoggedInUser.email = undefined;
    updatedLoggedInUser.password = undefined;

    return successResponse(res, {
      message: "follower added successfully",
      updatedLoggedInUser,
      updatedUser,
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
  updateFollowers,
  addNotification,
  updateProfilePic,
  updateCoverPic,
  getPostsByUser,
};
