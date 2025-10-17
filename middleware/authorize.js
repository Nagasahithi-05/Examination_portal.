/**
 * Authorization middleware
 * Checks if user has required role(s) to access a resource
 * Must be used after auth middleware
 */
const authorize = (roles = []) => {
  // Ensure roles is an array
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    try {
      // Check if user object exists (should be added by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has required role
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
        });
      }

      // User has required permissions
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in authorization'
      });
    }
  };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Check if user is teacher or admin
 */
const isTeacherOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Teacher or Admin access required'
    });
  }

  next();
};

/**
 * Check if user is student
 */
const isStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Student access required'
    });
  }

  next();
};

/**
 * Check if user owns the resource or is admin
 * Requires resourceUserId in req.params or req.body
 */
const isOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Get resource user ID from params or body
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'Resource user ID not provided'
      });
    }

    // Check if user owns the resource
    if (req.user.userId !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

/**
 * Dynamic role checker
 * Can be used for complex permission logic
 */
const checkPermission = (permissionCallback) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const hasPermission = await permissionCallback(req.user, req);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in permission check'
      });
    }
  };
};

/**
 * Rate limiting by role
 */
const rateLimitByRole = (limits = {}) => {
  const defaultLimits = {
    student: 100,    // requests per window
    teacher: 200,
    admin: 500
  };

  const finalLimits = { ...defaultLimits, ...limits };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const limit = finalLimits[userRole] || finalLimits.student;

    // Store limit info for use by rate limiting middleware
    req.roleBasedLimit = limit;
    
    next();
  };
};

/**
 * Validate exam access for students
 */
const validateExamAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Only apply to students
    if (req.user.role !== 'student') {
      return next();
    }

    const examId = req.params.examId || req.body.examId;
    
    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID required'
      });
    }

    // Import here to avoid circular dependency
    const Exam = require('../models/Exam');
    
    const exam = await Exam.findById(examId);
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
        message: 'Exam is not currently available'
      });
    }

    // Check if student has access
    if (!exam.canAccess(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this exam'
      });
    }

    next();
  } catch (error) {
    console.error('Exam access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in exam access validation'
    });
  }
};

module.exports = {
  authorize,
  isAdmin,
  isTeacherOrAdmin,
  isStudent,
  isOwnerOrAdmin,
  checkPermission,
  rateLimitByRole,
  validateExamAccess
};