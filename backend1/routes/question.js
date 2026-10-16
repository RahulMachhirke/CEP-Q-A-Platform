const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Question = require('../models/Question');

// Inline Multer setup to completely prevent reference errors
const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/notes/'); 
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
}).single('noteFile');

// 1. GET ALL QUESTIONS
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (err) {
    console.error('Fetch Questions Error:', err);
    res.status(500).json({ message: 'Error fetching questions.' });
  }
});

// 2. POST A NEW QUESTION
router.post('/', async (req, res) => {
  try {
    const { title, description, branch, subject, authorName } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const newQuestion = new Question({
      title,
      description,
      branch: branch || 'IT',
      subject: subject || 'General',
      authorName: authorName || 'Anonymous',
      answers: []
    });

    await newQuestion.save();
    res.status(201).json({ message: 'Question posted successfully!', newQuestion });
  } catch (err) {
    console.error('Post Question Error:', err);
    res.status(500).json({ message: 'Error saving question.' });
  }
});

// 3. POST AN ANSWER WITH INLINE UPLOAD MIDDLEWARE
router.post('/:id/answers', uploadMiddleware, async (req, res) => {
  try {
    const questionId = req.params.id;
    const { authorName, authorBranch, authorStatus, authorIdCard, answerText } = req.body;

    if (!answerText && !req.file) {
      return res.status(400).json({ message: 'Answer text or a note file is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid Question ID format.' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    const fileUrl = req.file ? `uploads/notes/${req.file.filename}` : '';

    const newAnswer = {
      authorName: authorName || 'Student',
      authorBranch: authorBranch || 'IT',
      authorStatus: authorStatus || 'Student',
      authorIdCard: authorIdCard || '',
      answerText: answerText || '',
      fileUrl: fileUrl
    };

    question.answers.push(newAnswer);
    await question.save();

    res.status(201).json({ message: 'Answer added successfully!', question });
  } catch (err) {
    console.error('Answer Post Error:', err);
    res.status(500).json({ message: 'Error submitting answer.' });
  }
});

// 4. PATCH: INCREMENT UPVOTE / HELPFUL SCORE FOR AN ANSWER (Max 1 per user)
router.patch('/:questionId/answers/:answerId/vote', async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    const { userId } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ message: 'Invalid Question or Answer ID format.' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Please log in to upvote answers.' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    const answer = question.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found.' });
    }

    // Ensure upvotedBy array exists
    if (!answer.upvotedBy) {
      answer.upvotedBy = [];
    }

    // Check if user has already upvoted this answer
    const userIdStr = String(userId);
    if (answer.upvotedBy.includes(userIdStr)) {
      return res.status(400).json({ 
        message: 'You have already marked this answer as helpful. Limit is 1 upvote per answer.',
        alreadyUpvoted: true,
        votes: answer.votes || 0,
        answerId: answer._id
      });
    }

    // Register upvote
    answer.upvotedBy.push(userIdStr);
    answer.votes = (answer.votes || 0) + 1;
    await question.save();

    res.status(200).json({
      message: 'Vote registered successfully!',
      votes: answer.votes,
      answerId: answer._id,
      upvoted: true
    });
  } catch (err) {
    console.error('Upvote Error:', err);
    res.status(500).json({ message: 'Error updating vote count.' });
  }
});

module.exports = router;