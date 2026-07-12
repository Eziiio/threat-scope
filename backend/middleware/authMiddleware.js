import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect Routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check for token in Authorization headers (Bearer Token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. No token provided.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

    // Fetch user from database and attach to request object
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[Auth Middleware Error] ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Token is invalid or expired.'
    });
  }
};

// Authorize roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'User identity is missing. Auth protect middleware must precede authorize middleware.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};
