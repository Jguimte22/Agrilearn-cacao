const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header (try both x-auth-token and Authorization)
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    console.log('🔐 Auth check for:', req.method, req.path);
    console.log('🔑 Token present:', !!token);

    // Check if not token
    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        console.log('✅ Token decoded:', { userId: decoded.user?.id || decoded.id });

        // Get user from database - handle both token formats
        let userId;
        if (decoded.user) {
            userId = decoded.user.id;
        } else if (decoded.id) {
            userId = decoded.id;
        } else {
            console.log('❌ Invalid token structure:', decoded);
            return res.status(401).json({ message: 'Invalid token structure' });
        }

        req.user = await User.findById(userId).select('-password');

        if (!req.user) {
            console.log('❌ User not found for ID:', userId);
            return res.status(401).json({ message: 'Token is not valid' });
        }

        console.log('✅ User authenticated:', req.user._id);
        next();
    } catch (err) {
        console.error('❌ Auth middleware error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
