const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const User = require('../models/User');
const coursesData = require('../data/courses');
const { protect } = require('../middleware/auth');
const { adminAuth, isAdmin } = require('../middleware/adminAuth');
const ErrorResponse = require('../utils/errorResponse');

// @route   POST /api/admin/register
// @desc    Register a new admin
// @access  Private/SuperAdmin
router.post(
  '/register',
  [
    protect,
    adminAuth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
      check('role', 'Please include a valid role').isIn(['admin', 'superadmin'])
    ]
  ],
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      // Check if admin exists
      let admin = await Admin.findOne({ email });
      if (admin) {
        return next(new ErrorResponse('Admin already exists', 400));
      }

      // Create admin
      admin = new Admin({
        name,
        email,
        password,
        role
      });

      await admin.save();

      // Create token
      const token = admin.getSignedJwtToken();

      res.status(201).json({
        success: true,
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (err) {
      console.error(err.message);
      next(new ErrorResponse('Server Error', 500));
    }
  }
);

// @route   POST /api/admin/login
// @desc    Authenticate admin & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if admin exists
      const admin = await Admin.findOne({ email }).select('+password');
      if (!admin) {
        return next(new ErrorResponse('Invalid credentials', 401));
      }

      // Check if admin is active
      if (!admin.isActive) {
        return next(new ErrorResponse('Account is disabled', 401));
      }

      // Check password
      const isMatch = await admin.matchPassword(password);
      if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
      }

      // Update last login
      admin.lastLogin = Date.now();
      await admin.save();

      // Create token
      const token = admin.getSignedJwtToken();

      res.json({
        success: true,
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (err) {
      console.error(err.message);
      next(new ErrorResponse('Server Error', 500));
    }
  }
);

// @route   GET /api/admin/me
// @desc    Get current logged in admin
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    
    if (!admin) {
      return next(new ErrorResponse('Admin not found', 404));
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (err) {
    console.error(err.message);
    next(new ErrorResponse('Server Error', 500));
  }
});

// @route   GET /api/admin
// @desc    Get all admins
// @access  Private/Admin
router.get('/', [protect, adminAuth], async (req, res, next) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (err) {
    console.error(err.message);
    next(new ErrorResponse('Server Error', 500));
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', [protect, isAdmin], async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error(err.message);
    next(new ErrorResponse('Server Error', 500));
  }
});

// @route   GET /api/admin/courses
// @desc    Get the seeded course catalog
// @access  Private/Admin
router.get('/courses', [protect, isAdmin], async (req, res, next) => {
  try {
    res.json({
      success: true,
      count: coursesData.length,
      data: coursesData
    });
  } catch (err) {
    console.error(err.message);
    next(new ErrorResponse('Server Error', 500));
  }
});

// @route   GET /api/admin/:id
// @desc    Get admin by ID
// @access  Private/Admin
router.get('/:id', [protect, adminAuth], async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    
    if (!admin) {
      return next(new ErrorResponse(`Admin not found with id of ${req.params.id}`, 404));
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return next(new ErrorResponse(`Admin not found with id of ${req.params.id}`, 404));
    }
    next(new ErrorResponse('Server Error', 500));
  }
});

// @route   PUT /api/admin/:id
// @desc    Update admin
// @access  Private/Admin
router.put(
  '/:id',
  [
    protect,
    adminAuth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('role', 'Please include a valid role').isIn(['admin', 'superadmin']),
      check('isActive', 'isActive must be a boolean').optional().isBoolean()
    ]
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, role, isActive } = req.body;

    // Build admin object
    const adminFields = {};
    if (name) adminFields.name = name;
    if (email) adminFields.email = email;
    if (role) adminFields.role = role;
    if (typeof isActive !== 'undefined') adminFields.isActive = isActive;

    try {
      let admin = await Admin.findById(req.params.id);

      if (!admin) {
        return next(new ErrorResponse(`Admin not found with id of ${req.params.id}`, 404));
      }

      // Check if email already exists
      if (email && email !== admin.email) {
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
          return next(new ErrorResponse('Email already in use', 400));
        }
      }

      // Prevent modifying the last superadmin
      if (admin.role === 'superadmin' && role === 'admin') {
        const superadminCount = await Admin.countDocuments({ role: 'superadmin' });
        if (superadminCount <= 1) {
          return next(
            new ErrorResponse('Cannot change the role of the last superadmin', 400)
          );
        }
      }

      admin = await Admin.findByIdAndUpdate(
        req.params.id,
        { $set: adminFields },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        data: admin
      });
    } catch (err) {
      console.error(err.message);
      next(new ErrorResponse('Server Error', 500));
    }
  }
);

// @route   DELETE /api/admin/:id
// @desc    Delete admin
// @access  Private/Admin
router.delete('/:id', [protect, adminAuth], async (req, res, next) => {
try {
  const admin = await Admin.findById(req.params.id);
  if (!admin) {
    return next(new ErrorResponse(`Admin not found with id of ${req.params.id}`, 404));
  }

  if (admin.role === 'superadmin') {
    const superadminCount = await Admin.countDocuments({ role: 'superadmin' });
    if (superadminCount <= 1) {
      return next(new ErrorResponse('Cannot delete the last superadmin', 400));
    }
  }

  await admin.remove();
  res.json({
    success: true,
    data: {}
  });
} catch (err) {
  console.error(err.message);
  if (err.kind === 'ObjectId') {
    return next(new ErrorResponse(`Admin not found with id of ${req.params.id}`, 404));
  }
  next(new ErrorResponse('Server Error', 500));
}
});

// Import user progress routes
const userProgressRoutes = require('./admin/userProgress');

console.log('🔧 Loading user progress routes into admin routes...');

// Use user progress routes
router.use('/users', userProgressRoutes);

console.log('✅ User progress routes mounted at /api/admin/users');

module.exports = router;