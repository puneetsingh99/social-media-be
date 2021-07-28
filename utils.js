const jwt = require("jsonwebtoken");

const generateToken = (payload, secret) => {
  const token = jwt.sign(payload, secret, { expiresIn: "24h" });
  return token;
};

const successResponse = (res, { message, ...params }, status = 200) => {
  const response = {
    success: true,
    message,
    ...params,
  };
  return res.status(status).json(response);
};

const errorResponse = (res, message, error) => {
  const response = {
    success: false,
    message,
    errorMessage: error.message,
  };

  return res.status(500).json(response);
};

module.exports = {
  generateToken,
  errorResponse,
  successResponse,
};
