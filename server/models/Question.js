const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  id: Number,
  title: String,
  description: String,
  language: String,
  code: String,
  expected: String,
  level: { type: String, enum: ['easy', 'medium', 'hard'] },
  correctAnswer: String,
  hints: { type: [String], default: [] },
  maxChangePercentage: { type: Number, min: 0, max: 100, default: null },
  source: { type: String, enum: ['seed', 'admin'], default: 'seed' },
});

module.exports = mongoose.model('Question', QuestionSchema);
