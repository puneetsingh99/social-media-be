const routeNotFound = (req, res, next) => {
  return res.status(404).json({ success: false, message: "route not found" });
};

module.exports = { routeNotFound };
