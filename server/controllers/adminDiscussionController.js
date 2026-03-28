const DiscussionMessage = require("../models/DiscussionMessage");

exports.listReportedMessages = async (_req, res) => {
  try {
    const messages = await DiscussionMessage.find({
      "reports.0": { $exists: true },
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    return res.json(
      messages.map((message) => ({
        _id: message._id,
        authorUsername: message.authorUsername,
        text: message.text,
        createdAt: message.createdAt,
        reportCount: Array.isArray(message.reports) ? message.reports.length : 0,
        reportedBy: Array.isArray(message.reports)
          ? message.reports.map((report) => report.username)
          : [],
        question: {
          _id: message.question,
          level: message.questionLevel,
          id: message.questionNumber,
          title: message.questionTitle,
        },
      }))
    );
  } catch (_error) {
    return res.status(500).json({ message: "Unable to load reported messages." });
  }
};
