const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const QuizScore = require('./models/QuizScore');

const checkQuizScores = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const scores = await QuizScore.find({}).sort({ userId: 1 });

        console.log('\n=== QUIZ SCORES COLLECTION ===');
        console.log('Total score records:', scores.length);

        scores.forEach(s => {
            console.log(`\nUser: ${s.userId}`);
            console.log(`Quiz ID: ${s.quizId}`);
            console.log(`Quiz Name: ${s.quizName}`);
            console.log(`Score: ${s.score}`);
            console.log(`Best Score: ${s.bestScore}`);
            console.log(`Completed At: ${s.completedAt}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkQuizScores();
