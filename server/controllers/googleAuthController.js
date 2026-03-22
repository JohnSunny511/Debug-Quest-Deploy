// controllers/googleAuthController.js

const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const { z } = require("zod");
const User = require("../models/User");

exports.googleLogin = async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Authentication service unavailable" });
    }

    const parsed = z
      .object({
        token: z.string().min(20, "Invalid Google login token").max(4096, "Invalid Google login token"),
      })
      .safeParse(req.body || {});

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid Google login token" });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const { token } = parsed.data;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name } = payload;
    if (!sub || !email || !name) {
      return res.status(400).json({ message: "Invalid Google account data" });
    }
    
    let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });

    if (!user) {
      let displayUsername = String(name).replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_").slice(0, 24) || "user";
      const existingUser = await User.findOne({ username: displayUsername });
      if (existingUser) {
          displayUsername = `${displayUsername.slice(0, 19)}_${sub.slice(-4)}`;
      }
      
      user = await User.create({ 
        username: displayUsername, 
        email,
        googleId: sub,
        role: "user",
        password: crypto.randomBytes(24).toString("hex"),
      });
    } else if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }

    const myToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token: myToken,
      username: user.username,
      redirectTo: user.role === "admin" ? "/dashboard/internal" : "/challenges",
    });
  } catch (_err) {
    res.status(400).json({ message: "Login failed" });
  }
};
