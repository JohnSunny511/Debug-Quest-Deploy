const express = require("express");
const {
  listMessages,
  createMessage,
  reportMessage,
  deleteMessage,
} = require("../controllers/discussionController");
const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateUser);
router.get("/questions/:questionId/messages", listMessages);
router.post("/messages", createMessage);
router.post("/messages/:messageId/report", reportMessage);
router.delete("/messages/:messageId", requireAdmin, deleteMessage);

module.exports = router;
