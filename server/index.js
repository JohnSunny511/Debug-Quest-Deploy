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
const internalDashboardRoutes = require("./routes/internalDashboardRoutes");
const { authenticateUser } = require('./middleware/authMiddleware');

// DB connection
const connectDB = require('./config/db');  // ✅ import db.js

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
const executeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  keyPrefix: "judge0-execute",
  message: "Execution limit reached. Please wait a moment before trying again.",
});

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
app.use("/api/dashboard/internal", internalDashboardRoutes);
app.use("/api/dashboard/internal/chatbot", chatbotAdminRoutes);
app.use("/api/dashboard/internal/questions", adminQuestionRoutes);

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
      language_id: z.number().int().refine((value) => [50, 63, 71].includes(value), "Unsupported language"),
      code: z.string().min(1).max(50000),
    })
    .safeParse(req.body || {});

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid execution request" });
  }

  if (!process.env.JUDGE0_KEY) {
    return res.status(500).json({ error: "Code execution service unavailable" });
  }

  const { language_id, code } = parsed.data;

  const headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": process.env.JUDGE0_KEY,
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  };

  try {
    // submit
    const submission = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=false",
      {
        language_id,
        source_code: code,
        stdin: "",
      },
      { headers }
    );

    const token = submission.data.token;

    // poll
    let result;
    while (true) {
      const response = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false`,
        { headers }
      );

      result = response.data;

      if (result.status.id > 2) break;
      await new Promise(r => setTimeout(r, 1500));
    }

    res.json({
      output: result.stdout || result.stderr || result.compile_output || "No output",
      status: result.status.description
    });

  } catch (error) {
    res.status(500).json({
      error: "Code execution failed"
    });
  }
});

module.exports = app;
