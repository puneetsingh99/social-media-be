const { User } = require("../models/user.model");
const { successResponse, errorResponse } = require("../utils");
const { extend } = require("lodash");

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

    if (updateData.userCreatedQuiz) {
      await User.findOneAndUpdate({ _id: req.userId });
    }

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
        message: "Trying to follow yourself",
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

// /:userId/notification
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

module.exports = {
  getAllUser,
  deleteAllUser,
  userIdCheck,
  getUser,
  updateUser,
  deleteUser,
  addFollower,
  addNotification,
};
