const { User } = require("../models/user.model");
const bcrypt = require("bcrypt");

const loginHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.json({
        success: false,
        message: "Please enter email and password",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password" });
    }
    req.login = "successful";
    req.userId = user._id;
    req.username = user.username;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Something went wrong",
      errorMessage: error.message,
    });
  }
};

module.exports = { loginHandler };
