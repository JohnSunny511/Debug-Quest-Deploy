// routes/authRoutes.js (MUST look like this)
const express = require("express");
const { signup, login, getSession } = require("../controllers/authController"); // <-- MUST BE IMPORTED
const { googleLogin } = require("../controllers/googleAuthController");
const { rateLimit } = require("../middleware/rateLimit");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please try again later.",
});

router.post("/signup", authRateLimit, signup); 
router.post("/login", authRateLimit, login); 

router.post("/google-login", authRateLimit, googleLogin); 
router.get("/session", authenticateUser, getSession);

module.exports = router;
