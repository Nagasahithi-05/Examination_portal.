const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Question = require('../models/Question');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private (Teacher/Admin only)
router.post('/', auth, authorize(['teacher', 'admin']), [
  body('text').trim().isLength({ min: 10 }).withMessage('Question text must be at least 10 characters'),
  body('type').isIn(['mcq', 'short-answer', 'coding', 'essay', 'true-false', 'fill-blank']).withMessage('Invalid question type'),
  body('subject').trim().isLength({ min: 2 }).withMessage('Subject is required'),
  body('marks').isInt({ min: 1 }).withMessage('Marks must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const questionData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const question = new Question(questionData);
    await question.save();

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: { question }
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating question'
    });
  }
});

// @route   GET /api/questions
// @desc    Get all questions (created by user)
// @access  Private (Teacher/Admin)
router.get('/', auth, authorize(['teacher', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, type, subject, difficulty, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {
      createdBy: req.user.userId,
      isActive: true
    };

    // Filters
    if (type) query.type = type;
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email');

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalQuestions: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching questions'
    });
  }
});

// @route   GET /api/questions/:id
// @desc    Get question by ID
// @access  Private
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid question ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID',
        errors: errors.array()
      });
    }

    const question = await Question.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'teacher' && question.createdBy._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { question }
    });

  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching question'
    });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update question
// @access  Private (Teacher/Admin who created it)
router.put('/:id', auth, authorize(['teacher', 'admin']), [
  param('id').isMongoId().withMessage('Invalid question ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID',
        errors: errors.array()
      });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check ownership
    if (question.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update question
    const allowedUpdates = [
      'text', 'type', 'subject', 'difficulty', 'marks', 'timeLimit',
      'options', 'codingDetails', 'answerDetails', 'fillBlanks',
      'explanation', 'hints', 'media', 'tags', 'category'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field];
      }
    });

    // Increment version
    question.version += 1;

    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: { question }
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating question'
    });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete question (soft delete)
// @access  Private (Teacher/Admin who created it)
router.delete('/:id', auth, authorize(['teacher', 'admin']), [
  param('id').isMongoId().withMessage('Invalid question ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID',
        errors: errors.array()
      });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check ownership
    if (question.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete
    question.isActive = false;
    await question.save();

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting question'
    });
  }
});

// @route   POST /api/questions/bulk
// @desc    Create multiple questions
// @access  Private (Teacher/Admin only)
router.post('/bulk', auth, authorize(['teacher', 'admin']), [
  body('questions').isArray().withMessage('Questions must be an array'),
  body('questions.*.text').trim().isLength({ min: 10 }).withMessage('Question text must be at least 10 characters'),
  body('questions.*.type').isIn(['mcq', 'short-answer', 'coding', 'essay', 'true-false', 'fill-blank']).withMessage('Invalid question type'),
  body('questions.*.subject').trim().isLength({ min: 2 }).withMessage('Subject is required'),
  body('questions.*.marks').isInt({ min: 1 }).withMessage('Marks must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { questions } = req.body;
    
    // Add createdBy to each question
    const questionsWithCreator = questions.map(q => ({
      ...q,
      createdBy: req.user.userId
    }));

    const createdQuestions = await Question.insertMany(questionsWithCreator);

    res.status(201).json({
      success: true,
      message: `${createdQuestions.length} questions created successfully`,
      data: { 
        questions: createdQuestions,
        count: createdQuestions.length
      }
    });

  } catch (error) {
    console.error('Bulk create questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating questions'
    });
  }
});

// @route   GET /api/questions/subjects/list
// @desc    Get list of subjects
// @access  Private
router.get('/subjects/list', auth, async (req, res) => {
  try {
    const subjects = await Question.distinct('subject', {
      createdBy: req.user.userId,
      isActive: true
    });

    res.json({
      success: true,
      data: { subjects }
    });

  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subjects'
    });
  }
});

// @route   POST /api/questions/:id/duplicate
// @desc    Duplicate a question
// @access  Private (Teacher/Admin)
router.post('/:id/duplicate', auth, authorize(['teacher', 'admin']), [
  param('id').isMongoId().withMessage('Invalid question ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID',
        errors: errors.array()
      });
    }

    const originalQuestion = await Question.findById(req.params.id);
    if (!originalQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check access permissions
    if (originalQuestion.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create duplicate
    const questionData = originalQuestion.toObject();
    delete questionData._id;
    delete questionData.createdAt;
    delete questionData.updatedAt;
    delete questionData.__v;
    
    questionData.createdBy = req.user.userId;
    questionData.parentQuestion = originalQuestion._id;
    questionData.version = 1;
    questionData.usageCount = 0;
    questionData.text = `${questionData.text} (Copy)`;

    const duplicatedQuestion = new Question(questionData);
    await duplicatedQuestion.save();

    res.status(201).json({
      success: true,
      message: 'Question duplicated successfully',
      data: { question: duplicatedQuestion }
    });

  } catch (error) {
    console.error('Duplicate question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while duplicating question'
    });
  }
});

// @route   GET /api/questions/exam/:examId
// @desc    Get all questions for a specific exam
// @access  Private
router.get('/exam/:examId', auth, [
  param('examId').isMongoId().withMessage('Invalid exam ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const questions = await Question.find({ examId: req.params.examId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: questions.length,
      data: {
        questions: questions
      }
    });
  } catch (error) {
    console.error('Get questions by exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;