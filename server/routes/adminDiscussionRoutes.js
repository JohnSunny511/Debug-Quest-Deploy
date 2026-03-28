const express = require("express");
const { listReportedMessages } = require("../controllers/adminDiscussionController");
const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateUser, requireAdmin);
router.get("/reported", listReportedMessages);

module.exports = router;
