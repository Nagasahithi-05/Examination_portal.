const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// @route   POST /api/exams
// @desc    Create a new exam
// @access  Private (Teacher/Admin only)
router.post('/', auth, authorize(['teacher', 'admin']), [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('subject').trim().isLength({ min: 2 }).withMessage('Subject is required'),
  body('duration').isInt({ min: 1, max: 600 }).withMessage('Duration must be between 1 and 600 minutes'),
  body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be at least 1'),
  body('passingMarks').isInt({ min: 0 }).withMessage('Passing marks must be a positive number'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date')
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

    const examData = {
      ...req.body,
      createdBy: req.user.userId
    };

    // Validate passing marks doesn't exceed total marks
    if (examData.passingMarks > examData.totalMarks) {
      return res.status(400).json({
        success: false,
        message: 'Passing marks cannot exceed total marks'
      });
    }

    // Validate date range
    if (new Date(examData.endDate) <= new Date(examData.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Handle questions - create Question documents first if questions data is provided
    let questionIds = [];
    if (examData.questions && Array.isArray(examData.questions) && examData.questions.length > 0) {
      // Check if questions are ObjectIds or actual question data
      const firstQuestion = examData.questions[0];
      
      // If it's question data (not ObjectIds), create Question documents
      if (typeof firstQuestion === 'object' && (firstQuestion.question || firstQuestion.text)) {
        for (const questionData of examData.questions) {
          // Map question type to match the enum values
          let questionType = questionData.type || 'mcq';
          const typeMap = {
            'multiple-choice': 'mcq',
            'Multiple Choice': 'mcq',
            'short-answer': 'short-answer',
            'Short Answer': 'short-answer',
            'coding': 'coding',
            'essay': 'essay',
            'true-false': 'true-false',
            'fill-blank': 'fill-blank'
          };
          questionType = typeMap[questionType] || questionType;
          
          // Map options format
          let mappedOptions = [];
          if (questionData.options && Array.isArray(questionData.options)) {
            mappedOptions = questionData.options
              .filter(opt => opt && opt.trim() !== '') // Filter out empty options
              .map((optText, index) => ({
                text: optText,
                isCorrect: questionData.correctAnswer === optText || 
                          questionData.correctAnswer === index.toString() ||
                          questionData.correctAnswer === index
              }));
          }
          
          const question = new Question({
            text: questionData.question || questionData.text,
            type: questionType,
            subject: examData.subject, // Use exam's subject
            marks: parseInt(questionData.marks) || 1,
            options: mappedOptions,
            exam: null, // Will be updated after exam is created
            createdBy: req.user.userId
          });
          
          await question.save();
          questionIds.push(question._id);
        }
      } else {
        // If they're already ObjectIds, use them directly
        questionIds = examData.questions;
      }
    }

    // Create exam with question references
    const examDataToSave = {
      ...examData,
      questions: questionIds,
      createdBy: req.user.userId
    };

    const exam = new Exam(examDataToSave);
    
    // Generate access code only if not provided
    if (!examData.accessCode) {
      exam.generateAccessCode();
    }
    
    await exam.save();

    // Update questions with exam reference
    if (questionIds.length > 0) {
      await Question.updateMany(
        { _id: { $in: questionIds } },
        { $set: { exam: exam._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: { exam }
    });

  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating exam'
    });
  }
});

// @route   GET /api/exams
// @desc    Get all exams (filtered by role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, subject, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'teacher') {
      query.createdBy = req.user.userId;
    } else if (req.user.role === 'student') {
      query.isActive = true;
      query.isPublished = true;
    }

    // Additional filters
    if (status) {
      const now = new Date();
      if (status === 'active') {
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
      } else if (status === 'upcoming') {
        query.startDate = { $gt: now };
      } else if (status === 'completed') {
        query.endDate = { $lt: now };
      }
    }

    if (subject) {
      query.subject = subject;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const exams = await Exam.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Exam.countDocuments(query);

    res.json({
      success: true,
      data: {
        exams,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalExams: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exams'
    });
  }
});

// @route   GET /api/exams/code/:accessCode
// @desc    Get exam by access code (for students to join)
// @access  Private (Student, Teacher, Admin)
router.get('/code/:accessCode', auth, [
  param('accessCode').isLength({ min: 6, max: 6 }).withMessage('Access code must be 6 characters')
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

    const { accessCode } = req.params;

    // Find exam by access code
    const exam = await Exam.findOne({ accessCode })
      .populate('createdBy', 'name email')
      .populate('questions');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Invalid access code'
      });
    }

    // Check if exam is active (within start and end date)
    const now = new Date();
    if (now < exam.startDate || now > exam.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Exam is not currently available'
      });
    }

    res.json({
      success: true,
      data: {
        exam: {
          id: exam._id,
          title: exam.title,
          description: exam.description,
          subject: exam.subject,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          startDate: exam.startDate,
          endDate: exam.endDate,
          questions: exam.questions,
          createdBy: exam.createdBy
        }
      }
    });
  } catch (error) {
    console.error('Get exam by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/exams/:id
// @desc    Get exam by ID
// @access  Private
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid exam ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID',
        errors: errors.array()
      });
    }

    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email institution department')
      .populate('questions');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'student') {
      if (!exam.isActive || !exam.isPublished) {
        return res.status(403).json({
          success: false,
          message: 'Exam is not available'
        });
      }
    } else if (req.user.role === 'teacher' && exam.createdBy._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // For students, hide correct answers if exam hasn't ended
    if (req.user.role === 'student' && exam.status !== 'completed') {
      exam.questions = exam.questions.map(question => {
        const questionObj = question.toObject();
        if (questionObj.options) {
          questionObj.options = questionObj.options.map(option => ({
            _id: option._id,
            text: option.text
          }));
        }
        delete questionObj.correctAnswer;
        return questionObj;
      });
    }

    res.json({
      success: true,
      data: { exam }
    });

  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exam'
    });
  }
});

// @route   PUT /api/exams/:id
// @desc    Update exam
// @access  Private (Teacher/Admin who created it)
router.put('/:id', auth, authorize(['teacher', 'admin']), [
  param('id').isMongoId().withMessage('Invalid exam ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID',
        errors: errors.array()
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check ownership
    if (exam.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Don't allow updates if exam has started and has submissions
    const hasSubmissions = await Submission.countDocuments({ exam: exam._id });
    if (hasSubmissions > 0 && exam.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update exam that has active submissions'
      });
    }

    // Update exam
    const allowedUpdates = [
      'title', 'description', 'subject', 'duration', 'totalMarks', 'passingMarks',
      'startDate', 'endDate', 'settings', 'instructions', 'category', 'difficulty',
      'tags', 'isActive', 'isPublished'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        exam[field] = req.body[field];
      }
    });

    await exam.save();

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: { exam }
    });

  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating exam'
    });
  }
});

// @route   DELETE /api/exams/:id
// @desc    Delete exam
// @access  Private (Teacher/Admin who created it)
router.delete('/:id', auth, authorize(['teacher', 'admin']), [
  param('id').isMongoId().withMessage('Invalid exam ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID',
        errors: errors.array()
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check ownership
    if (exam.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if exam has submissions
    const submissionCount = await Submission.countDocuments({ exam: exam._id });
    if (submissionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete exam with existing submissions'
      });
    }

    await Exam.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });

  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting exam'
    });
  }
});

// @route   POST /api/exams/:id/questions
// @desc    Add questions to exam
// @access  Private (Teacher/Admin who created it)
router.post('/:id/questions', auth, authorize(['teacher', 'admin']), [
  param('id').isMongoId().withMessage('Invalid exam ID'),
  body('questionIds').isArray().withMessage('Question IDs must be an array')
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

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check ownership
    if (exam.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { questionIds } = req.body;

    // Verify questions exist and belong to the user
    const questions = await Question.find({
      _id: { $in: questionIds },
      createdBy: req.user.userId,
      isActive: true
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some questions not found or not accessible'
      });
    }

    // Add questions to exam (avoid duplicates)
    const existingQuestionIds = exam.questions.map(q => q.toString());
    const newQuestionIds = questionIds.filter(id => !existingQuestionIds.includes(id));
    
    exam.questions.push(...newQuestionIds);
    
    // Update total marks
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, exam.totalMarks);
    exam.totalMarks = totalMarks;
    
    await exam.save();

    res.json({
      success: true,
      message: `${newQuestionIds.length} questions added to exam`,
      data: { 
        exam,
        addedQuestions: newQuestionIds.length
      }
    });

  } catch (error) {
    console.error('Add questions to exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding questions'
    });
  }
});

// @route   POST /api/exams/:id/enroll
// @desc    Enroll student in exam
// @access  Private (Student only)
router.post('/:id/enroll', auth, authorize(['student']), [
  param('id').isMongoId().withMessage('Invalid exam ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID',
        errors: errors.array()
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (!exam.isActive || !exam.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Exam is not available for enrollment'
      });
    }

    // Check if exam hasn't ended
    if (exam.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Exam has already ended'
      });
    }

    // Check if student is already enrolled
    const isEnrolled = exam.enrolledStudents.some(
      student => student.student.toString() === req.user.userId
    );

    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this exam'
      });
    }

    // Enroll student
    exam.enrolledStudents.push({
      student: req.user.userId,
      enrolledAt: new Date(),
      status: 'enrolled'
    });

    await exam.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in exam',
      data: { examId: exam._id }
    });

  } catch (error) {
    console.error('Enroll in exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while enrolling in exam'
    });
  }
});

// @route   GET /api/exams/:id/analytics
// @desc    Get exam analytics
// @access  Private (Teacher/Admin who created it)
router.get('/:id/analytics', auth, authorize(['teacher', 'admin']), [
  param('id').isMongoId().withMessage('Invalid exam ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID',
        errors: errors.array()
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check ownership
    if (exam.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get submissions for analytics
    const submissions = await Submission.find({ exam: exam._id })
      .populate('student', 'name email studentId');

    const analytics = {
      totalEnrolled: exam.enrolledStudents.length,
      totalSubmissions: submissions.length,
      completionRate: exam.enrolledStudents.length > 0 ? 
        (submissions.length / exam.enrolledStudents.length * 100).toFixed(2) : 0,
      averageScore: submissions.length > 0 ? 
        (submissions.reduce((sum, s) => sum + s.scoring.percentage, 0) / submissions.length).toFixed(2) : 0,
      passRate: submissions.length > 0 ? 
        (submissions.filter(s => s.scoring.passed).length / submissions.length * 100).toFixed(2) : 0,
      gradeDistribution: {
        'A+': submissions.filter(s => s.scoring.grade === 'A+').length,
        'A': submissions.filter(s => s.scoring.grade === 'A').length,
        'B+': submissions.filter(s => s.scoring.grade === 'B+').length,
        'B': submissions.filter(s => s.scoring.grade === 'B').length,
        'C+': submissions.filter(s => s.scoring.grade === 'C+').length,
        'C': submissions.filter(s => s.scoring.grade === 'C').length,
        'D': submissions.filter(s => s.scoring.grade === 'D').length,
        'F': submissions.filter(s => s.scoring.grade === 'F').length
      },
      topPerformers: submissions
        .sort((a, b) => b.scoring.percentage - a.scoring.percentage)
        .slice(0, 10)
        .map(s => ({
          student: s.student,
          score: s.scoring.percentage,
          grade: s.scoring.grade
        })),
      averageTimeSpent: submissions.length > 0 ? 
        Math.round(submissions.reduce((sum, s) => sum + s.timeSpent, 0) / submissions.length / 60) : 0
    };

    res.json({
      success: true,
      data: { analytics }
    });

  } catch (error) {
    console.error('Get exam analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

// @route   PATCH /api/exams/:id/publish
// @desc    Publish/unpublish an exam
// @access  Private (Teacher/Admin who created it)
router.patch('/:id/publish', auth, authorize(['teacher', 'admin']), [
  param('id').isMongoId().withMessage('Invalid exam ID')
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

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check access permissions
    if (exam.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Toggle published status
    exam.isPublished = !exam.isPublished;
    await exam.save();

    res.json({
      success: true,
      message: `Exam ${exam.isPublished ? 'published' : 'unpublished'} successfully`,
      data: {
        exam: {
          id: exam._id,
          title: exam.title,
          isPublished: exam.isPublished
        }
      }
    });
  } catch (error) {
    console.error('Publish exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;