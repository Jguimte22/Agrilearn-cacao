const ErrorResponse = require('../utils/errorResponse');

// Middleware to ensure user is an admin
const adminAuth = (req, res, next) => {
  // Check if user exists and is an admin
  if (req.admin && req.admin.role === 'superadmin') {
    return next();
  }
  
  return next(
    new ErrorResponse('Not authorized to access this route', 403)
  );
};

// Middleware to check if user is an admin or superadmin
const isAdmin = (req, res, next) => {
  if (req.admin && (req.admin.role === 'admin' || req.admin.role === 'superadmin')) {
    return next();
  }
  
  return next(
    new ErrorResponse('Not authorized to access this route', 403)
  );
};

module.exports = {
  adminAuth,
  isAdmin
};
