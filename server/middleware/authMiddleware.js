//authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET;  // same one used in authController

exports.authenticateUser = async (req, res, next) => {
  if (!SECRET) {
    return res.status(500).json({ message: "Authentication service unavailable" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.id).select("_id username role");
    if (!user) {
      return res.status(401).json({ message: "Authentication required", redirectTo: "/login" });
    }

    req.user = {
      id: String(user._id),
      username: user.username,
      role: user.role,
    };
    next();
  } catch (_err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Forbidden",
      redirectTo: "/challenges",
    });
  }

  return next();
};
