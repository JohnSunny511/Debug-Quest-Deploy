//index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const session = require("cookie-session");
const axios = require("axios");
const { z } = require("zod");
const { rateLimit } = require("./middleware/rateLimit");


// Routes
const questionRoutes = require('./routes/questionRoutes');
const authRoutes = require('./routes/authRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatbotRoutes = require("./routes/chatbotRoutes");
const chatbotAdminRoutes = require("./routes/chatbotAdminRoutes");
const adminQuestionRoutes = require("./routes/adminQuestionRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const adminDiscussionRoutes = require("./routes/adminDiscussionRoutes");
const internalDashboardRoutes = require("./routes/internalDashboardRoutes");
const { authenticateUser } = require('./middleware/authMiddleware');

// DB connection
const connectDB = require('./config/db');  // ✅ import db.js

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
const codeExecutionServiceBaseUrl = process.env.CODE_EXECUTION_SERVICE_URL
  ? process.env.CODE_EXECUTION_SERVICE_URL.replace(/\/+$/, "")
  : "";
const executeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  keyPrefix: "code-execute",
  message: "Execution limit reached. Please wait a moment before trying again.",
});

const LANGUAGE_CONFIG = {
  50: { language: "c", version: "10.2.0" },
  63: { language: "javascript", version: "18.15.0" },
  71: { language: "python", version: "3.10.0" },
};

const buildExecutionEndpoints = (baseUrl) => {
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
};

// Middlewares
app.use(cors());
app.use(express.json({ limit: "1mb" }));
if (sessionSecret) {
  app.use(
    session({
      secret: sessionSecret,
      httpOnly: true,
      sameSite: "lax",
    })
  );
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiRoutes);
app.use("/api/questions", questionRoutes); 
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/dashboard/internal", internalDashboardRoutes);
app.use("/api/dashboard/internal/chatbot", chatbotAdminRoutes);
app.use("/api/dashboard/internal/questions", adminQuestionRoutes);
app.use("/api/dashboard/internal/discussions", adminDiscussionRoutes);

// Connect DB
connectDB().catch(() => {
  console.error("❌ MongoDB connection error");
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

app.post("/api/execute", authenticateUser, executeRateLimit, async (req, res) => {
  const parsed = z
    .object({
      language_id: z.number().int().refine((value) => Object.keys(LANGUAGE_CONFIG).map(Number).includes(value), "Unsupported language"),
      code: z.string().min(1).max(50000),
    })
    .safeParse(req.body || {});

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid execution request" });
  }

  if (!codeExecutionServiceBaseUrl) {
    return res.status(500).json({
      error: "Code execution service unavailable",
      detail: "CODE_EXECUTION_SERVICE_URL is not configured.",
    });
  }

  const { language_id, code } = parsed.data;
  const { language, version } = LANGUAGE_CONFIG[language_id];
  const executionEndpoints = buildExecutionEndpoints(codeExecutionServiceBaseUrl);
  const requestBody = {
    language,
    version,
    files: [{ content: code }],
  };

  try {
    let response;
    let lastError;
    const attemptedEndpoints = [];

    for (const executionEndpoint of executionEndpoints) {
      try {
        attemptedEndpoints.push(executionEndpoint);
        response = await axios.post(executionEndpoint, requestBody, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        });
        break;
      } catch (error) {
        error.attemptedEndpoints = attemptedEndpoints.slice();
        lastError = error;
        // If the server responded with 400 Bad Request (e.g., unsupported language/version), 
        // the endpoint is correct but the payload is invalid. Don't fallback to other endpoints.
        if (error.response && error.response.status === 400) {
          break;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Execution service request failed");
    }

    const result = response.data || {};
    const run = result.run || {};

    res.json({
      output: run.output || run.stdout || run.stderr || run.compile_output || "No output",
      status: typeof run.code === "number" ? `Exit code ${run.code}` : "Completed",
    });

  } catch (error) {
    const upstreamDetail =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      error?.message ||
      "Unknown execution error";
    const attempted =
      Array.isArray(error?.attemptedEndpoints) && error.attemptedEndpoints.length
        ? ` Tried: ${error.attemptedEndpoints.join(", ")}`
        : "";

    res.status(500).json({
      error: "Code execution failed",
      detail: `${upstreamDetail}${attempted}`,
    });
  }
});

module.exports = app;
