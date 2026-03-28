const mongoose = require("mongoose");

const DiscussionReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DiscussionMessageSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true, index: true },
    questionLevel: { type: String, enum: ["easy", "medium", "hard"], required: true },
    questionNumber: { type: Number, required: true },
    questionTitle: { type: String, default: "" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorUsername: { type: String, required: true },
    text: { type: String, required: true, maxlength: 2000 },
    reports: { type: [DiscussionReportSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscussionMessage", DiscussionMessageSchema);
