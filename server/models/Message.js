const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    senderEmail: {
        type: String,
        required: [true, 'Please add an email'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Please add a message']
    },
    read: {
        type: Boolean,
        default: false
    },
    starred: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        default: 'inbox'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
