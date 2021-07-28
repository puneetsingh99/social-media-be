const jwt = require("jsonwebtoken");

const SECRET = process.env.SECRET;

const verifyAuth = (req, res, next) => {
  const token = req.headers.authorization;
  try {
    const decoded = jwt.verify(token, SECRET);
    res.loggedInUser = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access, please add the valid token",
    });
  }
};

module.exports = { verifyAuth };
