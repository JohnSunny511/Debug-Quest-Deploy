const express = require("express");
const router = express.Router();
const { generateBuggyAndCorrect } = require("../ai/generateBuggyCode");
const { z } = require("zod");
const { authenticateUser } = require("../middleware/authMiddleware");
const { rateLimit } = require("../middleware/rateLimit");
const { sanitizeText } = require("../utils/security");

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyPrefix: "ai-generate",
  message: "AI generation limit reached. Please wait a moment before trying again.",
});

router.post("/generate", authenticateUser, aiRateLimit, async (req, res) => {
  try {
    const parsed = z
      .object({
        language: z.enum(["python", "javascript", "c"]),
        topic: z.string().min(2).max(120),
      })
      .safeParse({
        language: sanitizeText(req.body?.language, { maxLength: 20, allowNewlines: false }).toLowerCase(),
        topic: sanitizeText(req.body?.topic, { maxLength: 120, allowNewlines: false }),
      });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Language and topic are required" });
    }

    const { language, topic } = parsed.data;
    const codeObj = await generateBuggyAndCorrect(language, topic);
    res.json({
      buggyCode: codeObj.buggy,
      correctCode: codeObj.correct,
      language,
      topic
    });
  } catch (_err) {
    res.status(500).json({ error: "Failed to generate AI question" });
  }

});

// Check correct code
router.post("/generate-correct", authenticateUser, async (req, res) => {
  const parsed = z
    .object({
      buggyCode: z.string().min(1).max(50000),
      language: z.string().max(20).optional(),
    })
    .safeParse(req.body || {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  const { buggyCode } = parsed.data;

  // Here you'd run the AI to fix code — placeholder for now
  const correctCode = buggyCode.replace("retrn", "return");

  res.json({ correctCode });
});

module.exports = router;
