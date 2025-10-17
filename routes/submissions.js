const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// @route   POST /api/submissions/start
// @desc    Start an exam (create submission)
// @access  Private (Student only)
router.post('/start', auth, authorize(['student']), [
  body('examId').isMongoId().withMessage('Invalid exam ID')
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

    const { examId } = req.body;
    const studentId = req.user.userId;

    // Get exam details
    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if exam is available
    if (!exam.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Exam is not available'
      });
    }

    // Check if student is enrolled
    if (!exam.canAccess(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this exam'
      });
    }

    // Check existing submissions
    const existingSubmissions = await Submission.find({ 
      student: studentId, 
      exam: examId 
    });

    // Check attempt limit
    if (existingSubmissions.length >= exam.settings.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum attempts exceeded'
      });
    }

    // Check for active submission
    const activeSubmission = existingSubmissions.find(s => s.status === 'in-progress');
    if (activeSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active submission',
        data: { submissionId: activeSubmission._id }
      });
    }

    // Create new submission
    const submission = new Submission({
      student: studentId,
      exam: examId,
      attemptNumber: existingSubmissions.length + 1,
      startTime: new Date(),
      answers: exam.questions.map(question => ({
        question: question._id,
        answer: null,
        timeSpent: 0,
        marksAwarded: 0
      })),
      systemInfo: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    await submission.save();

    // Update exam enrollment status
    const enrollment = exam.enrolledStudents.find(
      student => student.student.toString() === studentId
    );
    if (enrollment) {
      enrollment.status = 'started';
      await exam.save();
    }

    res.status(201).json({
      success: true,
      message: 'Exam started successfully',
      data: { 
        submissionId: submission._id,
        startTime: submission.startTime,
        duration: exam.duration
      }
    });

  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting exam'
    });
  }
});

// @route   GET /api/submissions/:id
// @desc    Get submission details
// @access  Private
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid submission ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID',
        errors: errors.array()
      });
    }

    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name email studentId')
      .populate('exam', 'title subject duration totalMarks passingMarks')
      .populate('answers.question');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'teacher') {
      const exam = await Exam.findById(submission.exam._id);
      if (exam.createdBy.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: { submission }
    });

  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submission'
    });
  }
});

// @route   PUT /api/submissions/:id/answer
// @desc    Save answer for a question
// @access  Private (Student only)
router.put('/:id/answer', auth, authorize(['student']), [
  param('id').isMongoId().withMessage('Invalid submission ID'),
  body('questionId').isMongoId().withMessage('Invalid question ID'),
  body('answer').exists().withMessage('Answer is required')
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

    const { questionId, answer, timeSpent = 0 } = req.body;
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check ownership
    if (submission.student.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if submission is still active
    if (submission.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Submission is not active'
      });
    }

    // Find and update the answer
    const answerIndex = submission.answers.findIndex(
      ans => ans.question.toString() === questionId
    );

    if (answerIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Question not found in submission'
      });
    }

    submission.answers[answerIndex].answer = answer;
    submission.answers[answerIndex].timeSpent = timeSpent;

    await submission.save();

    res.json({
      success: true,
      message: 'Answer saved successfully',
      data: { 
        questionId,
        saved: true
      }
    });

  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving answer'
    });
  }
});

// @route   POST /api/submissions/:id/submit
// @desc    Submit exam
// @access  Private (Student only)
router.post('/:id/submit', auth, authorize(['student']), [
  param('id').isMongoId().withMessage('Invalid submission ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID',
        errors: errors.array()
      });
    }

    const submission = await Submission.findById(req.params.id)
      .populate('exam')
      .populate('answers.question');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check ownership
    if (submission.student.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already submitted
    if (submission.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Submission already completed'
      });
    }

    // Update submission
    submission.endTime = new Date();
    submission.submittedAt = new Date();
    submission.status = 'submitted';
    submission.timeSpent = Math.floor((submission.endTime - submission.startTime) / 1000);

    // Calculate score
    await submission.calculateScore();

    await submission.save();

    // Update exam analytics
    const exam = submission.exam;
    exam.analytics.totalAttempts += 1;
    
    // Recalculate exam analytics
    const allSubmissions = await Submission.find({ exam: exam._id, status: { $in: ['submitted', 'auto-submitted'] } });
    if (allSubmissions.length > 0) {
      exam.analytics.averageScore = allSubmissions.reduce((sum, s) => sum + s.scoring.percentage, 0) / allSubmissions.length;
      exam.analytics.passRate = (allSubmissions.filter(s => s.scoring.passed).length / allSubmissions.length) * 100;
      exam.analytics.completionRate = (allSubmissions.length / exam.enrolledStudents.length) * 100;
    }
    
    await exam.save();

    // Update enrollment status
    const enrollment = exam.enrolledStudents.find(
      student => student.student.toString() === req.user.userId
    );
    if (enrollment) {
      enrollment.status = 'completed';
      await exam.save();
    }

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        submissionId: submission._id,
        score: submission.scoring,
        timeSpent: submission.timeSpent
      }
    });

  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting exam'
    });
  }
});

// @route   GET /api/submissions/exam/:examId
// @desc    Get all submissions for an exam
// @access  Private (Teacher/Admin who created the exam)
router.get('/exam/:examId', auth, authorize(['teacher', 'admin']), [
  param('examId').isMongoId().withMessage('Invalid exam ID')
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

    const { page = 1, limit = 10, status, sortBy = 'submittedAt', order = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Check if user can access this exam
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let query = { exam: req.params.examId };
    if (status) {
      query.status = status;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sortBy]: sortOrder };

    const submissions = await Submission.find(query)
      .populate('student', 'name email studentId')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Submission.countDocuments(query);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalSubmissions: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get exam submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
});

// @route   GET /api/submissions/student/my
// @desc    Get student's own submissions
// @access  Private (Student only)
router.get('/student/my', auth, authorize(['student']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = { student: req.user.userId };
    if (status) {
      query.status = status;
    }

    const submissions = await Submission.find(query)
      .populate('exam', 'title subject duration totalMarks startDate endDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Submission.countDocuments(query);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalSubmissions: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get student submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
});

// @route   POST /api/submissions/:id/violation
// @desc    Add proctoring violation
// @access  Private (Student only - from client-side proctoring)
router.post('/:id/violation', auth, authorize(['student']), [
  param('id').isMongoId().withMessage('Invalid submission ID'),
  body('type').isIn(['tab-switch', 'window-blur', 'face-not-detected', 'multiple-faces', 'suspicious-activity']).withMessage('Invalid violation type'),
  body('description').optional().trim()
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

    const { type, description, severity = 'medium', screenshot } = req.body;
    const submission = await Submission.findById(req.params.id).populate('exam');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check ownership
    if (submission.student.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if submission is active
    if (submission.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Submission is not active'
      });
    }

    // Add violation
    submission.addViolation(type, description, severity, screenshot);

    // Check if should disqualify
    if (submission.shouldDisqualify(submission.exam.settings)) {
      submission.status = 'disqualified';
      submission.endTime = new Date();
    }

    await submission.save();

    res.json({
      success: true,
      message: 'Violation recorded',
      data: {
        violationCount: submission.violationCount,
        disqualified: submission.status === 'disqualified'
      }
    });

  } catch (error) {
    console.error('Add violation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording violation'
    });
  }
});

// @route   PUT /api/submissions/:id/grade
// @desc    Manually grade submission
// @access  Private (Teacher/Admin who created the exam)
router.put('/:id/grade', auth, authorize(['teacher', 'admin']), [
  param('id').isMongoId().withMessage('Invalid submission ID'),
  body('answers').isArray().withMessage('Answers must be an array')
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

    const { answers, comments } = req.body;
    const submission = await Submission.findById(req.params.id).populate('exam');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user can grade this submission
    const exam = submission.exam;
    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update manual grades
    answers.forEach(answerGrade => {
      const answerIndex = submission.answers.findIndex(
        ans => ans.question.toString() === answerGrade.questionId
      );
      
      if (answerIndex !== -1) {
        submission.answers[answerIndex].marksAwarded = answerGrade.marksAwarded;
        submission.answers[answerIndex].feedback = answerGrade.feedback;
        submission.answers[answerIndex].reviewNotes = answerGrade.reviewNotes;
      }
    });

    // Recalculate total score
    let totalMarks = 0;
    let marksObtained = 0;
    
    submission.answers.forEach(answer => {
      totalMarks += answer.question.marks;
      marksObtained += answer.marksAwarded || 0;
    });
    
    submission.scoring.totalMarks = totalMarks;
    submission.scoring.marksObtained = marksObtained;
    submission.scoring.percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
    submission.scoring.passed = marksObtained >= exam.passingMarks;
    
    // Update grade
    const percentage = submission.scoring.percentage;
    if (percentage >= 90) submission.scoring.grade = 'A+';
    else if (percentage >= 80) submission.scoring.grade = 'A';
    else if (percentage >= 70) submission.scoring.grade = 'B+';
    else if (percentage >= 60) submission.scoring.grade = 'B';
    else if (percentage >= 50) submission.scoring.grade = 'C+';
    else if (percentage >= 40) submission.scoring.grade = 'C';
    else if (percentage >= 30) submission.scoring.grade = 'D';
    else submission.scoring.grade = 'F';

    // Update review information
    submission.review.reviewedBy = req.user.userId;
    submission.review.reviewedAt = new Date();
    submission.review.comments = comments;
    submission.status = 'graded';

    await submission.save();

    res.json({
      success: true,
      message: 'Submission graded successfully',
      data: {
        scoring: submission.scoring,
        review: submission.review
      }
    });

  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while grading submission'
    });
  }
});

// @route   POST /api/submissions
// @desc    Create a new submission (submit exam)
// @access  Private (Student)
router.post('/', auth, authorize(['student']), [
  body('examId').isMongoId().withMessage('Invalid exam ID'),
  body('answers').isArray().withMessage('Answers must be an array'),
  body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a positive number')
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

    const { examId, answers, timeSpent } = req.body;

    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if student already submitted
    const existingSubmission = await Submission.findOne({
      examId: examId,
      studentId: req.user.userId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this exam'
      });
    }

    // Create submission
    const submission = new Submission({
      examId: examId,
      studentId: req.user.userId,
      answers: answers,
      timeSpent: timeSpent || 0,
      submittedAt: new Date(),
      status: 'submitted'
    });

    await submission.save();

    res.status(201).json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        submission: submission
      }
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/submissions/my
// @desc    Get current student's submissions
// @access  Private (Student)
router.get('/my', auth, authorize(['student']), async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.user.userId })
      .populate('examId', 'title subject duration totalMarks')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      data: {
        submissions: submissions
      }
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/submissions/teacher/recent
// @desc    Get recent submissions for teacher's exams
// @access  Private (Teacher only)
router.get('/teacher/recent', auth, authorize(['teacher', 'admin']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    // Find all exams created by this teacher
    const teacherExams = await Exam.find({ createdBy: req.user.userId }).select('_id');
    const examIds = teacherExams.map(exam => exam._id);

    if (examIds.length === 0) {
      return res.json({
        success: true,
        data: {
          submissions: []
        }
      });
    }

    // Find recent completed submissions for these exams
    const submissions = await Submission.find({
      exam: { $in: examIds },
      status: 'completed'
    })
      .populate('student', 'name email studentId')
      .populate('exam', 'title subject totalMarks')
      .sort({ submittedAt: -1 })
      .limit(limitNum);

    // Format the response
    const formattedSubmissions = submissions.map(submission => ({
      id: submission._id,
      studentName: submission.student?.name || 'Unknown Student',
      studentEmail: submission.student?.email,
      examTitle: submission.exam?.title || 'Unknown Exam',
      examSubject: submission.exam?.subject,
      score: submission.totalMarks > 0 
        ? Math.round((submission.marksObtained / submission.totalMarks) * 100) 
        : 0,
      marksObtained: submission.marksObtained,
      totalMarks: submission.totalMarks,
      date: submission.submittedAt,
      status: submission.status
    }));

    res.json({
      success: true,
      data: {
        submissions: formattedSubmissions
      }
    });

  } catch (error) {
    console.error('Get teacher recent submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent submissions'
    });
  }
});

// @route   GET /api/submissions/teacher/stats
// @desc    Get statistics for teacher's exams
// @access  Private (Teacher only)
router.get('/teacher/stats', auth, authorize(['teacher', 'admin']), async (req, res) => {
  try {
    // Find all exams created by this teacher
    const teacherExams = await Exam.find({ createdBy: req.user.userId });
    const examIds = teacherExams.map(exam => exam._id);

    if (examIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalExams: 0,
          totalStudents: 0,
          totalResults: 0,
          averageScore: 0
        }
      });
    }

    // Get all completed submissions for these exams
    const completedSubmissions = await Submission.find({
      exam: { $in: examIds },
      status: 'completed'
    });

    // Calculate stats
    const totalResults = completedSubmissions.length;
    
    // Get unique students
    const uniqueStudents = new Set(
      completedSubmissions.map(sub => sub.student.toString())
    );
    const totalStudents = uniqueStudents.size;

    // Calculate average score
    let averageScore = 0;
    if (totalResults > 0) {
      const totalPercentage = completedSubmissions.reduce((sum, submission) => {
        const percentage = submission.totalMarks > 0 
          ? (submission.marksObtained / submission.totalMarks) * 100 
          : 0;
        return sum + percentage;
      }, 0);
      averageScore = Math.round(totalPercentage / totalResults * 10) / 10;
    }

    res.json({
      success: true,
      data: {
        totalExams: teacherExams.length,
        totalStudents,
        totalResults,
        averageScore
      }
    });

  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

module.exports = router;