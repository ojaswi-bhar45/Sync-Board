const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { error } = require("../utils/response");

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
      return error(res, "No token provided", "UNAUTHORIZED", 401);

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return error(res, "User not found", "UNAUTHORIZED", 401);

    req.user = user;
    next();
  } catch {
    error(res, "Invalid token", "UNAUTHORIZED", 401);
  }
};

module.exports = auth;
