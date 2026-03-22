const Question = require("../models/Question");
const mongoose = require("mongoose");
const { z } = require("zod");
const { sanitizeFreeText, sanitizeText } = require("../utils/security");

const SUPPORTED_LANGUAGES = new Set(["python", "javascript", "c", "text"]);

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

function normalizeLanguageForStorage(value, fallbackText = "") {
  const lower = String(value || "").trim().toLowerCase();
  if (!lower) return inferLanguageFromCode(fallbackText);

  if (["python3", "py"].includes(lower)) return "python";
  if (["js", "node", "nodejs"].includes(lower)) return "javascript";
  if (["c99", "gcc"].includes(lower)) return "c";
  if (SUPPORTED_LANGUAGES.has(lower)) return lower;

  return inferLanguageFromCode(fallbackText);
}

function resolveLanguageForDisplay(value, fallbackText = "") {
  const stored = normalizeLanguageForStorage(value, fallbackText);
  if (stored !== "text") return stored;

  const inferred = inferLanguageFromCode(fallbackText);
  return inferred === "text" ? "text" : inferred;
}

function toAdminQuestionShape(question) {
  const resolvedLanguage = resolveLanguageForDisplay(question.language, question.code);
  return {
    _id: question._id,
    questionName: question.title || "",
    questionText: question.code || "",
    answerText: question.correctAnswer || question.expected || "",
    expectedOutcome: question.expected || "",
    difficulty: question.level,
    language: resolvedLanguage,
  };
}

exports.listAdminQuestions = async (_req, res) => {
  try {
    const questions = await Question.find({
      $or: [{ source: "admin" }, { language: "text" }],
    }).sort({ _id: -1 });
    return res.json(questions.map(toAdminQuestionShape));
  } catch (_error) {
    return res.status(500).json({ message: "Server error." });
  }
};

exports.createAdminQuestion = async (req, res) => {
  try {
    const parsed = z
      .object({
        questionName: z.string().min(1).max(120),
        questionText: z.string().min(1).max(20000),
        answerText: z.string().min(1).max(20000),
        expectedOutcome: z.string().max(20000).optional().default(""),
        difficulty: z.enum(["easy", "medium", "hard"]),
        language: z.string().max(20).optional().default("text"),
      })
      .safeParse({
        questionName: sanitizeText(req.body?.questionName, { maxLength: 120, allowNewlines: false }),
        questionText: sanitizeFreeText(req.body?.questionText, { maxLength: 20000 }),
        answerText: sanitizeFreeText(req.body?.answerText, { maxLength: 20000 }),
        expectedOutcome: sanitizeFreeText(req.body?.expectedOutcome, { maxLength: 20000 }),
        difficulty: sanitizeText(req.body?.difficulty, { maxLength: 10, allowNewlines: false }).toLowerCase(),
        language: sanitizeText(req.body?.language, { maxLength: 20, allowNewlines: false }).toLowerCase(),
      });

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid question payload." });
    }

    const { questionName, questionText, answerText, expectedOutcome, difficulty, language } = parsed.data;
    const selectedLanguage = normalizeLanguageForStorage(language, questionText);
    const lastQuestion = await Question.findOne({ level: difficulty }).sort({ id: -1 });
    const nextId = (lastQuestion?.id || 0) + 1;
    const resolvedExpected = String(expectedOutcome || "").trim() || answerText.trim();

    const question = await Question.create({
      id: nextId,
      title: questionName.trim(),
      language: selectedLanguage,
      code: questionText.trim(),
      expected: resolvedExpected,
      level: difficulty,
      correctAnswer: answerText.trim(),
      source: "admin",
    });

    return res.status(201).json(toAdminQuestionShape(question));
  } catch (_error) {
    return res.status(500).json({ message: "Server error." });
  }
};

exports.deleteAdminQuestion = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid question id." });
  }

  try {
    const deleted = await Question.findOneAndDelete({
      _id: id,
      $or: [{ source: "admin" }, { language: "text" }],
    });
    if (!deleted) {
      return res.status(404).json({ message: "Question not found." });
    }

    return res.json({ message: "Question deleted." });
  } catch (_error) {
    return res.status(500).json({ message: "Server error." });
  }
};
