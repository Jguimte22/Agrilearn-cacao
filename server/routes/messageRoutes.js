const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');

// Middleware to protect routes for both Admin and User (with admin role)
const protectMixed = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Try to find Admin
        const admin = await Admin.findById(decoded.id);
        if (admin && admin.isActive) {
            req.admin = admin;
            return next();
        }

        // Try to find User with admin role
        // Note: userAuth uses decoded.user.id, auth uses decoded.id. 
        // We need to handle both payload structures.
        const userId = decoded.id || (decoded.user && decoded.user.id);

        if (userId) {
            const user = await User.findById(userId);
            if (user && (user.role === 'admin' || user.role === 'superadmin')) {
                req.user = user;
                return next();
            }
        }

        return next(new ErrorResponse('Not authorized to access this route', 403));
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
};

// @route   POST /api/messages
// @desc    Create a new message (Contact Us form)
// @access  Public
router.post('/', async (req, res) => {
    try {
        // Support both old and new field names from frontend
        const { name, email, subject, message, sender, senderEmail, content } = req.body;

        const newMessage = await Message.create({
            sender: sender || name,
            senderEmail: senderEmail || email,
            subject,
            content: content || message
        });

        res.status(201).json({
            success: true,
            data: newMessage
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @route   GET /api/messages
// @desc    Get all messages
// @access  Private/Admin
router.get('/', [protectMixed], async (req, res) => {
    console.log('GET /api/messages request received');
    console.log('User/Admin:', req.admin || req.user);
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @route   PATCH /api/messages/:id/read
// @desc    Mark message as read
// @access  Private/Admin
router.patch('/:id/read', [protectMixed], async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true, runValidators: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            data: message
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @route   POST /api/messages/:id/reply
// @desc    Reply to a message via email
// @access  Private/Admin
router.post('/:id/reply', [protectMixed], async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        const { subject, replyMessage } = req.body;

        if (!replyMessage) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reply message'
            });
        }

        try {
            await sendEmail({
                email: message.senderEmail,
                subject: subject || `Re: ${message.subject}`,
                message: replyMessage,
                html: `<p>Dear ${message.sender},</p>
                       <p>${replyMessage.replace(/\n/g, '<br>')}</p>
                       <br>
                       <p>Best regards,</p>
                       <p>AgriLearn Cacao Team</p>`
            });

            res.status(200).json({
                success: true,
                data: 'Email sent successfully'
            });
        } catch (err) {
            console.error('Email send error:', err);
            return res.status(500).json({
                success: false,
                message: 'Email could not be sent. Please check server configuration.'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private/Admin
router.delete('/:id', [protectMixed], async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        await message.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

module.exports = router;
