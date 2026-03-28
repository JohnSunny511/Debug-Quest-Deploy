const express = require("express");
const router = express.Router();
const { generateBuggyAndCorrect } = require("../ai/generateBuggyCode");
const { z } = require("zod");
const { authenticateUser } = require("../middleware/authMiddleware");
const { rateLimit } = require("../middleware/rateLimit");
const { sanitizeText } = require("../utils/security");
const axios = require("axios");
const User = require("../models/User");
const { calculateChangeMetrics, normalizeLanguage } = require("../utils/codeChangeMetrics");

const LANGUAGE_CONFIG = {
  python: { version: "3.10.0" },
  javascript: { version: "18.15.0" },
  c: { version: "10.2.0" },
};

function buildExecutionEndpoints(baseUrl) {
  if (!baseUrl) return [];

  if (/\/(api\/v2\/execute|execute|api\/execute|run|api\/run)$/i.test(baseUrl)) {
    return [baseUrl];
  }

  return [
    `${baseUrl}/api/v2/execute`,
    `${baseUrl}/execute`,
    `${baseUrl}/api/execute`,
    `${baseUrl}/run`,
    `${baseUrl}/api/run`,
  ];
}

async function executeSubmissionCode(language, code) {
  const normalizedLanguage = normalizeLanguage(language);
  const languageConfig = LANGUAGE_CONFIG[normalizedLanguage];
  const baseUrl = process.env.CODE_EXECUTION_SERVICE_URL
    ? process.env.CODE_EXECUTION_SERVICE_URL.replace(/\/+$/, "")
    : "";

  if (!languageConfig || !baseUrl) {
    throw new Error("Code execution service unavailable.");
  }

  const executionEndpoints = buildExecutionEndpoints(baseUrl);
  const requestBody = {
    language: normalizedLanguage,
    version: languageConfig.version,
    files: [{ content: code }],
  };

  let response;
  let lastError;

  for (const executionEndpoint of executionEndpoints) {
    try {
      response = await axios.post(executionEndpoint, requestBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });
      break;
    } catch (error) {
      lastError = error;
      if (error.response && error.response.status === 400) {
        break;
      }
    }
  }

  if (!response) {
    throw lastError || new Error("Execution failed.");
  }

  const run = response.data?.run || {};
  const output = run.output || run.stdout || run.stderr || run.compile_output || "";
  const exitCode = typeof run.code === "number" ? run.code : null;

  return {
    output: String(output || ""),
    succeeded: exitCode === 0 && !String(run.stderr || run.compile_output || "").trim(),
  };
}

function normalizeOutput(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim();
}

function toLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
      title: codeObj.title,
      description: codeObj.description,
      buggyCode: codeObj.buggy,
      correctCode: codeObj.correct,
      expectedOutput: codeObj.expectedOutput,
      hints: codeObj.hints,
      maxChangePercentage: codeObj.maxChangePercentage,
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

router.post("/submit", authenticateUser, async (req, res) => {
  try {
    const parsed = z.object({
      language: z.enum(["python", "javascript", "c"]),
      originalCode: z.string().min(1).max(50000),
      submittedCode: z.string().min(1).max(50000),
      expectedOutput: z.string().max(20000).optional().default(""),
      maxChangePercentage: z.number().min(0).max(100).nullable().optional(),
    }).safeParse({
      language: sanitizeText(req.body?.language, { maxLength: 20, allowNewlines: false }).toLowerCase(),
      originalCode: String(req.body?.originalCode || ""),
      submittedCode: String(req.body?.submittedCode || ""),
      expectedOutput: String(req.body?.expectedOutput || ""),
      maxChangePercentage:
        typeof req.body?.maxChangePercentage === "number" ? req.body.maxChangePercentage : null,
    });

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid AI submission" });
    }

    const { language, originalCode, submittedCode, expectedOutput, maxChangePercentage } = parsed.data;
    const executed = await executeSubmissionCode(language, submittedCode);
    const normalizedExpectedOutput = normalizeOutput(expectedOutput);

    if (!executed.succeeded) {
      return res.json({
        message: "Incorrect. Your code did not run successfully.",
        expectedOutput,
        actualOutput: executed.output,
      });
    }

    if (normalizeOutput(executed.output) !== normalizedExpectedOutput) {
      return res.json({
        message: "Incorrect. Your code ran, but the output did not match the expected output.",
        expectedOutput,
        actualOutput: executed.output,
      });
    }

    const changeMetrics = calculateChangeMetrics(originalCode || "", submittedCode, language);

    if (typeof maxChangePercentage === "number" && changeMetrics.percentage > maxChangePercentage) {
      return res.json({
        message: `Output matched, but points were not awarded because the change percentage (${changeMetrics.percentage}%) exceeded the allowed limit (${maxChangePercentage}%).`,
        expectedOutput,
        actualOutput: executed.output,
        changePercentage: changeMetrics.percentage,
        maxChangePercentage,
      });
    }

    const today = toLocalDateKey(new Date());
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const nextActivity = Array.isArray(user.activity) ? [...user.activity] : [];
    const existingIndex = nextActivity.findIndex((entry) => entry.date === today);

    if (existingIndex >= 0) {
      nextActivity[existingIndex] = {
        date: today,
        count: Number(nextActivity[existingIndex].count || 0) + 1,
      };
    } else {
      nextActivity.push({ date: today, count: 1 });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        activity: nextActivity
          .sort((a, b) => String(a.date).localeCompare(String(b.date)))
          .slice(-365),
      },
      $inc: { points: 10 },
    });

    return res.json({
      message: "Correct! Points awarded.",
      expectedOutput,
      actualOutput: executed.output,
      changePercentage: changeMetrics.percentage,
      maxChangePercentage,
    });
  } catch (_error) {
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
