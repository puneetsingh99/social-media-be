function errorHandler(error, req, res, next) {
  console.log(error.stack);
  res.status(500).json({ sucess: false, message: error.message });
}

module.exports = { errorHandler };
