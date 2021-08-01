const { User } = require("../models/user.model");
const { generateToken, successResponse, errorResponse } = require("../utils");
const bcrypt = require("bcrypt");

const SECRET = process.env.SECRET;

const login = (req, res) => {
  if (req.login === "successful") {
    const token = generateToken({ userId: req.userId }, SECRET);

    const user = {
      userId: req.userId,
      username: req.username,
      token,
    };
    return successResponse(res, {
      message: "Login successful",
      user,
    });
  } else {
    return res.status(500).json({ success: false, message: "Could not login" });
  }
};

const signup = async (req, res) => {
  try {
    const user = req.body;

    const userAlreadyExists = await User.findOne({ username: user.username });

    if (userAlreadyExists) {  
      return res.json({ success: false, message: "User already exists" });
    }

    const newUser = new User(user);
    newUser.followers = [];
    newUser.following = [];
    newUser.notifications = [];

    if (!newUser.profilePic) {
      newUser.profilePic =
        "https://res.cloudinary.com/dxeyjgsl5/image/upload/v1627751597/social-media/default_profile_xuyimt.png";
    }

    if (!newUser.coverPic) {
      newUser.coverPic =
        "https://res.cloudinary.com/dxeyjgsl5/image/upload/v1627487517/social-media/cover_pic_default_popaj0.jpg";
    }

    if (!newUser.bio) {
      newUser.bio = "";
    }

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);

    const createdUser = await newUser.save();

    const token = generateToken({ userId: createdUser._id }, SECRET);
    const userId = createdUser._id;
    const name = createdUser.name;
    const username = createdUser.username;

    return successResponse(
      res,
      {
        message: "User added successfully",
        user: { userId, name, username, token },
      },
      201
    );
  } catch (error) {
    return errorResponse(res, "Could not add the user", error);
  }
};

module.exports = { login, signup };
