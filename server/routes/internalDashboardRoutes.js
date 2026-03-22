const express = require("express");
const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/access", authenticateUser, requireAdmin, (req, res) => {
  return res.json({ ok: true });
});

module.exports = router;
