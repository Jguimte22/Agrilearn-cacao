const express = require('express');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/images/courses');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Simple test endpoint to isolate the issue
router.post('/test-simple', protect, async (req, res) => {
  try {
    console.log('=== Simple Test Endpoint ===');
    console.log('req.body:', req.body);
    console.log('req.headers:', req.headers);
    
    res.json({
      success: true,
      message: 'Simple test works',
      body: req.body
    });
  } catch (error) {
    console.error('Simple test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findOne({ id: req.params.id });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Admin
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    console.log('=== Course Creation Request ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Debug the uploaded file details
    if (req.file) {
      console.log('=== Uploaded File Details ===');
      console.log('Original filename:', req.file.originalname);
      console.log('Saved filename:', req.file.filename);
      console.log('File mimetype:', req.file.mimetype);
      console.log('File size:', req.file.size);
      console.log('Upload path:', req.file.path);
      console.log('File buffer length:', req.file.buffer ? req.file.buffer.length : 'N/A');
    } else {
      console.log('=== No File Uploaded ===');
    }
    
    // Create course data from FormData
    const courseData = {
      id: req.body.id || `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: req.body.title || '',
      description: req.body.description || '',
      modules: parseInt(req.body.modules) || 4,
      duration: req.body.duration || '4 weeks',
      image: req.file ? `/images/courses/${req.file.filename}` : (req.body.image || 'CacaoBacics.png'),
      category: req.body.category || 'Beginner',
      progress: 0,
      score: 0,
      lastAccessed: 'Not started',
      status: req.body.status || 'active',
      lessons: [],
      createdAt: new Date()
    };

    console.log('Course data created:', courseData);
    console.log('Image path set to:', courseData.image);
    console.log('File uploaded:', req.file ? `${req.file.filename} (${req.file.size} bytes)` : 'No file');

    // Basic validation
    if (!courseData.title || !courseData.title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    if (!courseData.description || !courseData.description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }

    if (!courseData.category || !courseData.category.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    // Validate category
    const validCategories = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validCategories.includes(courseData.category)) {
      return res.status(400).json({
        success: false,
        error: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    console.log('Creating course with validated data...');
      const course = await Course.create(courseData);
      console.log('Course created successfully:', course);
      console.log('Course image path:', course.image);
      
      // Check if the uploaded file actually exists
      if (req.file) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../public/images/courses', req.file.filename);
        console.log('Checking if uploaded file exists at:', filePath);
        console.log('File exists:', fs.existsSync(filePath));
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log('File size:', stats.size, 'bytes');
          console.log('File permissions:', stats.mode);
        } else {
          console.error('Uploaded file does not exist at expected path!');
        }
      }
      
      // Create notifications for all users about the new course
      try {
        console.log('Creating notifications for new course:', course.title);
        const notifications = await Notification.createNewCourseNotification(
          course._id,
          course.title,
          course.description
        );
        console.log('Notifications created:', notifications.length);
      } catch (notificationError) {
        console.error('Error creating notifications:', notificationError);
      }
      
      res.status(201).json({
        success: true,
        data: course
      });
  } catch (error) {
    console.error('Error creating course:', error);
    console.error('Error stack:', error.stack);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.'
      });
    }
    
    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate field value'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Error creating course'
    });
  }
});

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Admin
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    console.log('=== Update Course Request ===');
    console.log('Course ID to update:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    // Handle FormData - convert to plain object and remove immutable fields
    const updateData = { ...req.body };

    // Remove fields that should never be updated
    delete updateData._id;
    delete updateData.id; // Don't allow changing the custom id
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.imageFile;
    delete updateData.imagePreview;

    // Handle numeric fields
    if (updateData.modules) {
      updateData.modules = parseInt(updateData.modules);
    }

    // Handle progress and score if they exist
    if (updateData.progress) {
      updateData.progress = parseInt(updateData.progress);
    }
    if (updateData.score) {
      updateData.score = parseInt(updateData.score);
    }

    // Handle image file if uploaded
    if (req.file) {
      updateData.image = `/images/courses/${req.file.filename}`;
      console.log('New image uploaded:', updateData.image);
    } else if (!updateData.image || updateData.image === '' || updateData.image === 'undefined') {
      // If no new file and no existing image value, remove image from update
      delete updateData.image;
      console.log('No image change - keeping existing image');
    }

    console.log('Final update data (after cleanup):', updateData);

    // Validate required fields if they are being updated
    if (updateData.title !== undefined && (!updateData.title || !updateData.title.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Title cannot be empty'
      });
    }

    if (updateData.description !== undefined && (!updateData.description || !updateData.description.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Description cannot be empty'
      });
    }

    if (updateData.category !== undefined) {
      const validCategories = ['Beginner', 'Intermediate', 'Advanced'];
      if (!validCategories.includes(updateData.category)) {
        return res.status(400).json({
          success: false,
          error: `Category must be one of: ${validCategories.join(', ')}`
        });
      }
    }

    // Try to find by MongoDB _id first, then by custom id
    let course;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      // Looks like a MongoDB ObjectId
      console.log('Searching by MongoDB _id');
      course = await Course.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true, // Return the updated document
          runValidators: true // Run schema validators
        }
      );
    } else {
      // Use custom id field
      console.log('Searching by custom id field');
      course = await Course.findOneAndUpdate(
        { id: req.params.id },
        updateData,
        {
          new: true, // Return the updated document
          runValidators: true // Run schema validators
        }
      );
    }

    if (!course) {
      console.log('Course not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    console.log('Course updated successfully:', course.title);
    console.log('Updated course data:', {
      _id: course._id,
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      duration: course.duration,
      modules: course.modules,
      image: course.image,
      status: course.status
    });

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    console.error('Error stack:', error.stack);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate field value - another course may already have this ID'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error updating course'
    });
  }
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== Delete Course Request ===');
    console.log('Course ID to delete:', req.params.id);
    
    // Try to find by MongoDB _id first, then by custom id
    let course;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      // Looks like a MongoDB ObjectId
      console.log('Searching by MongoDB _id');
      course = await Course.findByIdAndDelete(req.params.id);
    } else {
      // Use custom id field
      console.log('Searching by custom id field');
      course = await Course.findOneAndDelete({ id: req.params.id });
    }

    if (!course) {
      console.log('Course not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    console.log('Course deleted successfully:', course.title);
    
    // If course has an uploaded image, delete the file
    if (course.image && course.image.startsWith('/images/courses/')) {
      const filename = course.image.split('/').pop();
      const filePath = path.join(__dirname, '../public/images/courses', filename);
      
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Deleted image file:', filePath);
        }
      } catch (fileError) {
        console.error('Error deleting image file:', fileError);
      }
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting course'
    });
  }
});

module.exports = router;
