//questionRoutes.js

const express = require("express");
const router = express.Router();
const {
  getQuestionsByLevel,
  getQuestionByLevel,
  submitHandler
} = require("../controllers/questionController");
const { authenticateUser } = require("../middleware/authMiddleware");

// GET all questions by level
// /api/questions/easy
router.get("/:level", authenticateUser, getQuestionsByLevel);

// GET single question by level + id
// /api/questions/easy/1
router.get("/:level/:id", authenticateUser, getQuestionByLevel);

// POST submit code
// /api/questions/submit
router.post("/submit", authenticateUser, submitHandler);

module.exports = router;
