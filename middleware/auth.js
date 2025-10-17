const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and adds user information to request object
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format, authorization denied'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Check if user still exists - handle both token structures
      const userId = decoded.userId || decoded.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token structure, authorization denied'
        });
      }
      
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists, authorization denied'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated, authorization denied'
        });
      }

      // Add user info to request
      req.user = {
        userId: userId,
        email: user.email,
        role: decoded.user?.role || user.role,
        user: user
      };

      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired, please login again'
        });
      }
      
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token, authorization denied'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token verification failed, authorization denied'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
          const user = await User.findById(decoded.userId).select('-password');
          
          if (user && user.isActive) {
            req.user = {
              userId: decoded.userId,
              email: decoded.email,
              role: decoded.role,
              user: user
            };
          }
        } catch (tokenError) {
          // Ignore token errors in optional auth
          console.log('Optional auth token error:', tokenError.message);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'fallback_secret',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Verify token without middleware (utility function)
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Extract user ID from token
 */
const getUserIdFromToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

module.exports = {
  auth,
  optionalAuth,
  generateToken,
  verifyToken,
  getUserIdFromToken
};