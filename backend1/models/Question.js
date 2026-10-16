const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  authorName: { type: String, default: 'Anonymous' },
  authorBranch: { type: String, default: 'General' },
  authorStatus: { type: String, default: 'Student' },
  authorIdCard: { type: String, default: '' },
  answerText: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  votes: { type: Number, default: 0 },
  upvotedBy: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const QuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  branch: { type: String, default: 'General' },
  subject: { type: String, default: 'General' },
  authorName: { type: String, default: 'Anonymous' },
  authorIdCard: { type: String, default: '' },
  answers: [AnswerSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', QuestionSchema);