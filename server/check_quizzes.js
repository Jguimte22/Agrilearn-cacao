const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const CourseProgress = require('./models/CourseProgress');

const checkQuizzes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const progress = await CourseProgress.find({
            $or: [{ isCompleted: true }, { overallProgress: { $gte: 100 } }]
        }).sort({ userId: 1 });

        console.log('\n=== COMPLETED COURSE PROGRESS & QUIZZES ===');
        console.log('Total completed records:', progress.length);

        progress.forEach(p => {
            console.log(`\nUser: ${p.userId}`);
            console.log(`Course: ${p.courseId}`);
            console.log(`Progress: ${p.overallProgress}%`);
            console.log(`Is Completed: ${p.isCompleted}`);
            console.log(`Average Score: ${p.averageScore}`);
            console.log(`Quiz Results Length: ${p.quizResults ? p.quizResults.length : 0}`);

            if (p.quizResults && p.quizResults.length > 0) {
                console.log('Quizzes:', JSON.stringify(p.quizResults, null, 2));
            } else {
                console.log('NO QUIZ RESULTS FOUND');
            }
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkQuizzes();
