const express = require('express');
const { body, validationResult, param } = require('express-validator');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('examHistory.examId', 'title subject')
      .populate('examHistory.submissionId', 'scoring timeSpent');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('profile.phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('profile.dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
  body('profile.address').optional().trim().isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters')
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

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'profile'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'profile') {
          user.profile = { ...user.profile, ...req.body[field] };
        } else {
          user[field] = req.body[field];
        }
      }
    });

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   GET /api/users/dashboard/stats
// @desc    Get user dashboard statistics
// @access  Private
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    let stats = {};

    if (userRole === 'student') {
      // Student dashboard stats
      const totalExamsEnrolled = await Exam.countDocuments({
        'enrolledStudents.student': userId
      });

      const submissions = await Submission.find({ student: userId });
      const completedExams = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
      const passedExams = submissions.filter(s => s.scoring.passed).length;
      const averageScore = submissions.length > 0 ? 
        submissions.reduce((sum, s) => sum + s.scoring.percentage, 0) / submissions.length : 0;

      const upcomingExams = await Exam.find({
        'enrolledStudents.student': userId,
        startDate: { $gt: new Date() },
        isActive: true,
        isPublished: true
      }).countDocuments();

      stats = {
        totalExamsEnrolled,
        completedExams,
        upcomingExams,
        passedExams,
        averageScore: Math.round(averageScore * 100) / 100,
        recentSubmissions: submissions
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
          .slice(0, 5)
          .map(s => ({
            examId: s.exam,
            score: s.scoring.percentage,
            grade: s.scoring.grade,
            submittedAt: s.submittedAt
          }))
      };

    } else if (userRole === 'teacher') {
      // Teacher dashboard stats
      const totalExams = await Exam.countDocuments({ createdBy: userId });
      const activeExams = await Exam.countDocuments({ 
        createdBy: userId, 
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });
      
      const teacherExams = await Exam.find({ createdBy: userId });
      const examIds = teacherExams.map(exam => exam._id);
      
      const totalSubmissions = await Submission.countDocuments({ 
        exam: { $in: examIds } 
      });
      
      const totalStudents = await Exam.aggregate([
        { $match: { createdBy: userId } },
        { $unwind: '$enrolledStudents' },
        { $group: { _id: '$enrolledStudents.student' } },
        { $count: 'total' }
      ]);

      const recentSubmissions = await Submission.find({ 
        exam: { $in: examIds } 
      })
      .populate('student', 'name email')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 })
      .limit(5);

      stats = {
        totalExams,
        activeExams,
        totalSubmissions,
        totalStudents: totalStudents[0]?.total || 0,
        recentSubmissions: recentSubmissions.map(s => ({
          studentName: s.student.name,
          examTitle: s.exam.title,
          score: s.scoring.percentage,
          submittedAt: s.submittedAt
        }))
      };

    } else if (userRole === 'admin') {
      // Admin dashboard stats
      const totalUsers = await User.countDocuments({ isActive: true });
      const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
      const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
      const totalExams = await Exam.countDocuments();
      const totalSubmissions = await Submission.countDocuments();
      
      const recentUsers = await User.find({ isActive: true })
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

      stats = {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalExams,
        totalSubmissions,
        recentUsers
      };
    }

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get('/', auth, authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    // Filters
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { institution: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalUsers: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', auth, authorize(['admin']), [
  param('id').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('examHistory.examId', 'title subject')
      .populate('examHistory.submissionId', 'scoring timeSpent');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin only)
router.put('/:id', auth, authorize(['admin']), [
  param('id').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'role', 'institution', 'department', 'isActive', 'isVerified', 'profile'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'profile') {
          user.profile = { ...user.profile, ...req.body[field] };
        } else {
          user[field] = req.body[field];
        }
      }
    });

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user (Admin only)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize(['admin']), [
  param('id').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow admin to deactivate themselves
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Soft delete (deactivate)
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating user'
    });
  }
});

// @route   POST /api/users/:id/activate
// @desc    Activate user (Admin only)
// @access  Private (Admin only)
router.post('/:id/activate', auth, authorize(['admin']), [
  param('id').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User activated successfully'
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating user'
    });
  }
});

// @route   GET /api/users/students/enrolled/:examId
// @desc    Get students enrolled in specific exam
// @access  Private (Teacher/Admin)
router.get('/students/enrolled/:examId', auth, authorize(['teacher', 'admin']), [
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

    const exam = await Exam.findById(req.params.examId)
      .populate('enrolledStudents.student', 'name email studentId profile');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if teacher owns this exam
    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const enrolledStudents = exam.enrolledStudents.map(enrollment => ({
      student: enrollment.student,
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status
    }));

    res.json({
      success: true,
      data: { 
        examTitle: exam.title,
        enrolledStudents,
        totalEnrolled: enrolledStudents.length
      }
    });

  } catch (error) {
    console.error('Get enrolled students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching enrolled students'
    });
  }
});

// @route   GET /api/users/analytics/overview
// @desc    Get system analytics overview (Admin only)
// @access  Private (Admin only)
router.get('/analytics/overview', auth, authorize(['admin']), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // User analytics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Recent registrations
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Exam analytics
    const examStats = {
      total: await Exam.countDocuments(),
      active: await Exam.countDocuments({ isActive: true, isPublished: true }),
      recentlyCreated: await Exam.countDocuments({ createdAt: { $gte: startDate } })
    };

    // Submission analytics
    const submissionStats = {
      total: await Submission.countDocuments(),
      recent: await Submission.countDocuments({ createdAt: { $gte: startDate } }),
      completed: await Submission.countDocuments({ status: { $in: ['submitted', 'graded'] } })
    };

    const analytics = {
      period,
      dateRange: { startDate, endDate: now },
      users: {
        byRole: userStats,
        recentRegistrations
      },
      exams: examStats,
      submissions: submissionStats
    };

    res.json({
      success: true,
      data: { analytics }
    });

  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;