const Question = require("../models/Question");
const User = require("../models/User");
const mongoose = require("mongoose");
const { z } = require("zod");

function inferLanguageFromCode(value) {
  const text = String(value || "");

  const looksLikePython =
    /\bdef\s+\w+\s*\(/.test(text) ||
    /\bprint\s*\(/.test(text) ||
    /\bfor\s+\w+\s+in\b/.test(text) ||
    /\bif\s+.+:/.test(text) ||
    /\breturn\b/.test(text);
  if (looksLikePython) return "python";

  const looksLikeC =
    /#include\s*<[^>]+>/.test(text) ||
    /\bint\s+main\s*\(/.test(text) ||
    /\bprintf\s*\(/.test(text);
  if (looksLikeC) return "c";

  const looksLikeJavaScript =
    /\bfunction\s+\w+\s*\(/.test(text) ||
    /\bconsole\.log\s*\(/.test(text) ||
    /\b(let|const|var)\s+\w+/.test(text) ||
    /=>/.test(text);
  if (looksLikeJavaScript) return "javascript";

  return "text";
}

function withResolvedLanguage(question) {
  const payload = question?.toObject ? question.toObject() : question;
  if (!payload) return payload;

  const currentLanguage = String(payload.language || "").toLowerCase();
  if (currentLanguage !== "text" && currentLanguage !== "plaintext") {
    return payload;
  }

  const inferredLanguage = inferLanguageFromCode(payload.code);
  if (inferredLanguage !== "text") {
    payload.language = inferredLanguage;
  }

  return payload;
}

// GET /api/questions/:level
exports.getQuestionsByLevel = async (req, res) => {
  try {
    const parsed = z.object({ level: z.enum(["easy", "medium", "hard"]) }).safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid level" });
    }

    const { level } = parsed.data;
    const questions = await Question.find({ level });
    if (!questions.length) {
      return res.status(404).json({ error: "No questions found for this level" });
    }
    res.json(questions.map(withResolvedLanguage));
  } catch (_err) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/questions/:level/:id
exports.getQuestionByLevel = async (req, res) => {
  try {
    const parsed = z
      .object({
        level: z.enum(["easy", "medium", "hard"]),
        id: z.coerce.number().int().positive(),
      })
      .safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid question request" });
    }

    const { level, id } = parsed.data;
    const question = await Question.findOne({ level, id });
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.json(withResolvedLanguage(question));
  } catch (_err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/questions/submit
exports.submitHandler = async (req, res) => {
  try {
    const parsed = z
      .object({
        id: z.coerce.number().int().positive().optional(),
        code: z.string().min(1).max(50000),
        level: z.enum(["easy", "medium", "hard"]).optional(),
        questionId: z.string().optional(),
      })
      .refine(
        (value) =>
          (value.questionId && mongoose.Types.ObjectId.isValid(value.questionId)) ||
          (value.id !== undefined && value.level),
        { message: "A valid question reference is required." }
      )
      .safeParse(req.body || {});

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid submission" });
    }

    const { id, code, level, questionId } = parsed.data;
    let question = null;

    if (questionId) {
      question = await Question.findById(questionId);
    } else if (id !== undefined && level) {
      question = await Question.findOne({ id, level });
    } else if (id !== undefined) {
      question = await Question.findOne({ id });
    }

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const normalize = (str) => String(str ?? "").replace(/\r/g, "").trim();
    const expectedAnswer = question.correctAnswer ?? question.expected ?? "";
    const isCorrect = normalize(code) === normalize(expectedAnswer);

    if (isCorrect) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { points: 10 } });
      return res.json({ message: "Correct! Points awarded." });
    }

    return res.json({
      message: "Incorrect. Try again!",
      correctAnswer: expectedAnswer,
    });
  } catch (_err) {
    res.status(500).json({ message: "Server error." });
  }
};
