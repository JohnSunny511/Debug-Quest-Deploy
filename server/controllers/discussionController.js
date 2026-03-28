const mongoose = require("mongoose");
const { z } = require("zod");
const DiscussionMessage = require("../models/DiscussionMessage");
const Question = require("../models/Question");
const { sanitizeFreeText } = require("../utils/security");

function toMessageShape(message, currentUserId, isAdmin) {
  const reports = Array.isArray(message.reports) ? message.reports : [];
  const authorId = String(message.authorId || "");
  const isOwnMessage = authorId === String(currentUserId);

  return {
    _id: message._id,
    questionId: message.question,
    questionLevel: message.questionLevel,
    questionNumber: message.questionNumber,
    questionTitle: message.questionTitle,
    authorId,
    authorUsername: message.authorUsername,
    text: message.text,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    reportCount: reports.length,
    isReportedByCurrentUser: reports.some(
      (report) => String(report.userId) === String(currentUserId)
    ),
    canReport: !isAdmin && !isOwnMessage,
    canDelete: Boolean(isAdmin),
  };
}

exports.listMessages = async (req, res) => {
  const parsed = z
    .object({
      questionId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid question id."),
    })
    .safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid discussion request." });
  }

  try {
    const messages = await DiscussionMessage.find({ question: parsed.data.questionId })
      .sort({ createdAt: 1 })
      .lean();

    return res.json(
      messages.map((message) =>
        toMessageShape(message, req.user.id, req.user.role === "admin")
      )
    );
  } catch (_error) {
    return res.status(500).json({ message: "Unable to load discussion messages." });
  }
};

exports.createMessage = async (req, res) => {
  const parsed = z
    .object({
      questionId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid question id."),
      text: z.string().min(1).max(2000),
    })
    .safeParse({
      questionId: req.body?.questionId,
      text: sanitizeFreeText(req.body?.text, {
        maxLength: 2000,
        stripHtml: false,
        preserveFormatting: true,
      }),
    });

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid message payload." });
  }

  try {
    const question = await Question.findById(parsed.data.questionId).lean();
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    const message = await DiscussionMessage.create({
      question: question._id,
      questionLevel: question.level,
      questionNumber: question.id,
      questionTitle: question.title || "",
      authorId: req.user.id,
      authorUsername: req.user.username,
      text: parsed.data.text.trim(),
    });

    return res.status(201).json(
      toMessageShape(message.toObject(), req.user.id, req.user.role === "admin")
    );
  } catch (_error) {
    return res.status(500).json({ message: "Unable to send message." });
  }
};

exports.reportMessage = async (req, res) => {
  const parsed = z
    .object({
      messageId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid message id."),
    })
    .safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid report request." });
  }

  try {
    const message = await DiscussionMessage.findById(parsed.data.messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    if (String(message.authorId) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot report your own message." });
    }

    if (req.user.role === "admin") {
      return res.status(400).json({ message: "Admins cannot report messages." });
    }

    const existingReportIndex = (message.reports || []).findIndex(
      (report) => String(report.userId) === String(req.user.id)
    );

    if (existingReportIndex >= 0) {
      message.reports.splice(existingReportIndex, 1);
      await message.save();
      return res.json({ message: "Report removed." });
    }

    message.reports.push({
      userId: req.user.id,
      username: req.user.username,
      createdAt: new Date(),
    });
    await message.save();

    return res.json({ message: "Message reported." });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to report message." });
  }
};

exports.deleteMessage = async (req, res) => {
  const parsed = z
    .object({
      messageId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid message id."),
    })
    .safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid delete request." });
  }

  try {
    const deleted = await DiscussionMessage.findByIdAndDelete(parsed.data.messageId);
    if (!deleted) {
      return res.status(404).json({ message: "Message not found." });
    }

    return res.json({ message: "Message deleted." });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to delete message." });
  }
};
