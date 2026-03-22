const express = require("express");
const axios = require("axios");
const { z } = require("zod");
const { authenticateUser } = require("../middleware/authMiddleware");
const { rateLimit } = require("../middleware/rateLimit");
const { sanitizeFreeText } = require("../utils/security");

const router = express.Router();
const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL;
const chatbotQueryRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyPrefix: "chatbot-query",
  message: "Chatbot limit reached. Please wait a moment before trying again.",
});

router.post("/query", authenticateUser, chatbotQueryRateLimit, async (req, res) => {
  try {
    const parsed = z
      .object({
        q: z.string().min(1).max(1000),
      })
      .safeParse({
        q: sanitizeFreeText(req.body?.q, { maxLength: 1000, allowNewlines: false }),
      });

    if (!parsed.success) {
      return res.status(400).json({ error: "A valid query is required." });
    }

    const response = await axios.post(`${CHATBOT_SERVICE_URL}/query`, null, {
      params: { q: parsed.data.q },
    });
    return res.status(response.status).json(response.data);
  } catch (_error) {
    return res.status(502).json({ error: "Chatbot service is unavailable." });
  }
});

module.exports = router;
