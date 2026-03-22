//authController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { z } = require("zod");
const { sanitizeText } = require("../utils/security");

const SECRET = process.env.JWT_SECRET; 

const authSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be 30 characters or fewer.")
    .regex(/^[A-Za-z0-9_]+$/, "Username may only contain letters, numbers and underscores."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

exports.signup = async (req, res) => {
  try {
    if (!SECRET) {
      return res.status(500).json({ message: "Authentication service unavailable" });
    }

    const parsed = authSchema.safeParse({
      username: sanitizeText(req.body?.username, { maxLength: 30, allowNewlines: false }),
      password: String(req.body?.password ?? ""),
    });

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid signup data" });
    }

    const { username, password } = parsed.data;
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "Username already exists" });

    const user = new User({ username, password, role: "user" });
    await user.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (_err) {
    res.status(500).json({ message: "Signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    if (!SECRET) {
      return res.status(500).json({ message: "Authentication service unavailable" });
    }

    const parsed = authSchema.safeParse({
      username: sanitizeText(req.body?.username, { maxLength: 30, allowNewlines: false }),
      password: String(req.body?.password ?? ""),
    });

    if (!parsed.success) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { username, password } = parsed.data;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username: user.username }, SECRET, { expiresIn: "3h" });
    res.json({
      token,
      username: user.username,
      redirectTo: user.role === "admin" ? "/dashboard/internal" : "/challenges",
    });
  } catch (_err) {
    res.status(500).json({ message: "Login failed" });
  }
};

exports.getSession = async (req, res) => {
  return res.json({
    username: req.user.username,
    homePath: req.user.role === "admin" ? "/dashboard/internal" : "/challenges",
  });
};
