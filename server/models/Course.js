const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  modules: {
    type: Number,
    required: true,
    min: 1
  },
  lessons: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    duration: {
      type: String,
      default: '30 min'
    }
  }],
  duration: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAccessed: {
    type: String,
    default: 'Not started'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'coming-soon'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add text index for search functionality
courseSchema.index({ 
  title: 'text', 
  description: 'text',
  category: 'text'
});

module.exports = mongoose.model('Course', courseSchema);
