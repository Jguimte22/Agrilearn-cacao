// Load environment variables first
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file in the server directory
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const errorHandler = require('./middleware/errorMiddleware');
const coursesData = require('./data/courses');

console.log('Environment variables loaded:', {
  MONGODB_URI: process.env.MONGODB_URI ? '***' : 'Not found',
  JWT_SECRET: process.env.JWT_SECRET ? '***' : 'Not found',
  PORT: process.env.PORT || '5000 (default)'
});

// Import routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const progressRoutes = require('./routes/progressRoutes');
const courseRoutes = require('./routes/courseRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const quizScoreRoutes = require('./routes/quizScoreRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
const fs = require('fs');
const imagesPath = path.join(__dirname, 'public/images');
console.log('Serving static files from:', imagesPath);
app.use('/images', express.static(imagesPath, {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true
}));

// Serve uploaded files (profile pictures, etc.)
const uploadsPath = path.join(__dirname, 'public/uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Add a test route to check static file serving
app.get('/test-static', (req, res) => {
  const imagePath = path.join(__dirname, 'public/images');
  console.log('Static files directory:', imagePath);
  console.log('Directory exists:', fs.existsSync(imagePath));

  if (fs.existsSync(imagePath)) {
    const files = fs.readdirSync(imagePath);
    console.log('Files in images directory:', files);
    res.json({
      imagePath,
      exists: true,
      files: files
    });
  } else {
    res.json({
      imagePath,
      exists: false,
      message: 'Images directory does not exist'
    });
  }
});

// Connect to MongoDB Atlas
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

console.log('Connecting to MongoDB...');
console.log('Connection string:', uri.replace(/:[^:]*@/, ':***@')); // Hide password in logs

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
  .then(async () => {
    console.log("✅ Connected to MongoDB Atlas");

    // Seed achievements if they don't exist
    try {
      const { Achievement } = require('./models/Achievement');
      const achievementCount = await Achievement.countDocuments();

      if (achievementCount === 0) {
        console.log('🏆 No achievements found, seeding...');
        const seedAchievements = require('./utils/seedAchievements');
        await seedAchievements();
      } else {
        console.log(`🏆 Found ${achievementCount} achievements in database`);
      }
    } catch (error) {
      console.error('❌ Error checking/seeding achievements:', error.message);
    }
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error('Connection string used:', uri);
    process.exit(1);
  });

// Routes
app.use('/api/users', userRoutes);

// Debug: List all registered routes
console.log('🔍 Registered /api/users routes:');
userRoutes.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(',').toUpperCase();
    console.log(`  ${methods} /api/users${r.route.path}`);
  }
});
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);
console.log('🔍 About to register quiz-scores routes...');
console.log('🔍 quizScoreRoutes type:', typeof quizScoreRoutes);
app.use('/api/quiz-scores', quizScoreRoutes);
console.log('✅ Quiz scores routes registered at /api/quiz-scores');

console.log('✅ All routes registered including /api/certificates');

// Test route to verify admin routes are working
app.get('/api/admin/test', (req, res) => {
  res.json({ message: 'Admin routes are working!', timestamp: new Date() });
});

// Test route for certificates
app.get('/api/test-certificates', (req, res) => {
  res.json({ message: 'Certificate routes are loaded!', timestamp: new Date() });
});

// Direct user progress route (bypassing adminRoutes for testing)
app.get('/api/admin/users/:userId/progress', async (req, res) => {
  console.log('📊 DIRECT user progress endpoint called for userId:', req.params.userId);
  try {
    const { userId } = req.params;

    // Import models here to avoid circular dependencies
    const User = require('./models/User');
    const Course = require('./models/Course');
    const CourseProgress = require('./models/CourseProgress');

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's course progress
    const userProgress = await CourseProgress.find({ userId: userId })
      .sort({ updatedAt: -1 })
      .lean();

    // Get all courses for reference and create a lookup map
    const allCourses = await Course.find({ status: 'active' }).lean();

    // Create a lookup map for courses by their 'id' field (not _id)
    const courseLookup = {};
    allCourses.forEach(course => {
      courseLookup[course.id] = course;
    });

    // Manually populate course information using the courseId string
    console.log('📊 DEBUG: Course Lookup Map Keys:', Object.keys(courseLookup));

    const validUserProgress = userProgress.filter(progress => {
      if (courseLookup[progress.courseId]) {
        // Now that we use lean(), we can safely assign the course object
        progress.courseId = courseLookup[progress.courseId];
        return true;
      }
      console.log(`⚠️ Warning: Progress found for courseId '${progress.courseId}' but no matching active course found in DB.`);
      return false;
    });

    // Calculate progress metrics - check both isCompleted and overallProgress
    const totalCourses = allCourses.length;

    console.log('📊 DEBUG: Course Progress Calculation');
    console.log('📊 Total courses in system:', totalCourses);
    console.log('📊 User progress records:', userProgress.length);
    console.log('📊 Valid user progress records:', validUserProgress.length);

    // Log each progress record
    validUserProgress.forEach(p => {
      console.log(`📊 Course: ${p.courseId?.title || p.courseId}, Progress: ${p.overallProgress}%, isCompleted: ${p.isCompleted}`);
    });

    const coursesCompleted = validUserProgress.filter(p => p.isCompleted || p.overallProgress >= 100).length;
    const coursesInProgress = validUserProgress.filter(p => !p.isCompleted && p.overallProgress > 0 && p.overallProgress < 100).length;
    const coursesNotStarted = totalCourses - coursesInProgress - coursesCompleted;

    console.log('📊 FINAL COUNTS:');
    console.log('📊 Completed:', coursesCompleted);
    console.log('📊 In Progress:', coursesInProgress);
    console.log('📊 Not Started:', coursesNotStarted);

    // Get user's achievements
    const { UserAchievement } = require('./models/Achievement');
    const userAchievements = await UserAchievement.find({ userId: userId })
      .populate('achievementId')
      .sort({ unlockedAt: -1 });

    // Format achievements for the frontend
    const formattedAchievements = userAchievements.map(ua => ({
      id: ua._id,
      name: ua.achievementId.name,
      description: ua.achievementId.description,
      icon: ua.achievementId.icon,
      category: ua.achievementId.category,
      unlockedAt: ua.unlockedAt,
      badgeColor: ua.achievementId.badgeColor,
      rarity: ua.achievementId.rarity
    }));

    // Format recent activity from valid user progress
    // Format recent activity from valid user progress
    const recentActivity = validUserProgress.map(p => {
      // Debug log to check what p.courseId actually is
      console.log(`📊 DEBUG: Processing recent activity for courseId:`, p.courseId);

      let courseTitle = 'Unknown Course';
      if (p.courseId && typeof p.courseId === 'object' && p.courseId.title) {
        courseTitle = p.courseId.title;
      } else if (p.courseId && typeof p.courseId === 'string') {
        // Try to look it up again if it's still a string
        courseTitle = courseLookup[p.courseId]?.title || p.courseId;
      }

      return {
        course: courseTitle,
        progress: p.overallProgress,
        completed: p.isCompleted || p.overallProgress >= 100,
        score: p.averageScore,
        timeSpent: p.totalTimeSpent,
        lastUpdated: p.updatedAt || p.lastAccessed
      };
    });

    // Extract and format quiz scores
    const quizScores = [];
    validUserProgress.forEach(p => {
      // Only include quiz scores from COMPLETED courses
      const isCompleted = p.isCompleted || p.overallProgress >= 100;

      if (isCompleted && p.quizResults && p.quizResults.length > 0) {
        // Get the highest score for each quiz in this course
        // (Simple approach: take the average or the latest. Let's take the latest or best.)
        // Actually, let's just map all quiz results.

        // Since we don't have easy access to Quiz titles here, we'll use the Course title + "Quiz"
        // or if there are multiple quizzes, we might need to be more specific.
        // For now, let's assume one main quiz per course or average them.

        // Better approach: Use the course average score as the "Quiz Score" for that course
        // This aligns with the chart showing "Cacao History Quiz", "Planting Techniques Quiz", etc.

        let courseTitle = 'Unknown Course';
        if (p.courseId && typeof p.courseId === 'object' && p.courseId.title) {
          courseTitle = p.courseId.title;
        } else if (p.courseId && typeof p.courseId === 'string') {
          courseTitle = courseLookup[p.courseId]?.title || p.courseId;
        }

        if (p.averageScore > 0) {
          quizScores.push({
            quizName: `${courseTitle} Quiz`,
            score: p.averageScore,
            date: p.updatedAt || p.lastAccessed
          });
        }
      }
    });

    // Fetch standalone quiz scores
    const { QuizScore } = require('./models/QuizScore'); // Ensure this import is correct or move to top
    // Note: If QuizScore is not exported as { QuizScore }, but as module.exports = model, then:
    const QuizScoreModel = require('./models/QuizScore');

    const standaloneQuizScores = await QuizScoreModel.find({ userId: userId }).sort({ completedAt: -1 });

    console.log('📊 DEBUG: Standalone Quiz Scores found:', standaloneQuizScores.length);

    // Merge quiz scores
    // We want to show the standalone scores as they seem to be the primary source for games
    const finalQuizScores = standaloneQuizScores.map(s => ({
      quizName: s.quizName,
      score: s.score,
      date: s.completedAt,
      percentage: s.score // Frontend might use this
    }));
    if (finalQuizScores.length === 0 && quizScores.length > 0) {
      // Fallback to course progress quizzes if no standalone scores
      finalQuizScores.push(...quizScores);
    }

    // Calculate Monthly Progress (Last 6 Months)
    const monthlyProgress = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      const monthKey = `${monthName}`;

      // Filter activities for this month
      // 1. Course Progress (updatedAt)
      const coursesInMonth = validUserProgress.filter(p => {
        const pDate = new Date(p.updatedAt || p.lastAccessed);
        return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === year;
      });

      // 2. Quiz Scores (completedAt)
      const quizzesInMonth = standaloneQuizScores.filter(s => {
        const sDate = new Date(s.completedAt);
        return sDate.getMonth() === d.getMonth() && sDate.getFullYear() === year;
      });

      // Calculate metrics
      const activitiesCount = coursesInMonth.length + quizzesInMonth.length;
      let totalScore = 0;
      let scoreCount = 0;

      coursesInMonth.forEach(p => {
        if (p.averageScore > 0) {
          totalScore += p.averageScore;
          scoreCount++;
        }
      });

      quizzesInMonth.forEach(s => {
        if (s.score > 0) {
          totalScore += s.score;
          scoreCount++;
        }
      });

      const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

      monthlyProgress.push({
        month: monthKey,
        score: avgScore,
        activities: activitiesCount
      });
    }

    console.log('📊 DEBUG: Calculated Monthly Progress:', JSON.stringify(monthlyProgress, null, 2));

    // Return basic progress data
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.fullName || user.name,
          email: user.email,
          role: user.role
        },
        courses: {
          total: totalCourses,
          completed: coursesCompleted,
          inProgress: coursesInProgress,
          notStarted: coursesNotStarted
        },
        progressCount: userProgress.length,
        achievements: formattedAchievements,
        recentActivity: recentActivity,
        quizScores: finalQuizScores,
        monthlyProgress: monthlyProgress,
        message: 'Direct route working!'
      }
    });

  } catch (error) {
    console.error('Error in direct user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user progress',
      error: error.message
    });
  }
});

// Debug route to test server
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AgriLearn API' });
});

app.get('/api/courses', (req, res) => {
  res.json({
    success: true,
    count: coursesData.length,
    data: coursesData
  });
});

// 404 handler - must be AFTER all routes
app.use((req, res, next) => {
  console.log('⚠️ 404 Not Found:', req.method, req.url);
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
