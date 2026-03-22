const express = require("express");
const {
  listAdminQuestions,
  createAdminQuestion,
  deleteAdminQuestion,
} = require("../controllers/adminQuestionController");
const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticateUser, requireAdmin);

router.get("/", listAdminQuestions);
router.post("/", createAdminQuestion);
router.delete("/:id", deleteAdminQuestion);

module.exports = router;
