const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const Admin = require('../models/Admin');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Set token from Bearer token in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Set token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin still exists
    const currentAdmin = await Admin.findById(decoded.id);
    if (!currentAdmin) {
      return next(new ErrorResponse('The user belonging to this token no longer exists', 401));
    }

    // Check if admin is active
    if (!currentAdmin.isActive) {
      return next(new ErrorResponse('This account has been deactivated', 401));
    }

    // Grant access to protected route
    req.admin = currentAdmin;
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.admin.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
