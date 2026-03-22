const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  id: Number,
  title: String,
  language: String,
  code: String,
  expected: String,
  level: { type: String, enum: ['easy', 'medium', 'hard'] },
  correctAnswer: String,
  source: { type: String, enum: ['seed', 'admin'], default: 'seed' },
});

module.exports = mongoose.model('Question', QuestionSchema);
