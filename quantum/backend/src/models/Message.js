const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderUsername: {
        type: String,
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverUsername: {
        type: String,
        required: true
    },
    encryptedMessage: {
        type: String,
        required: true
    },
    quantumKeyId: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    delivered: {
        type: Boolean,
        default: false
    },
    read: {
        type: Boolean,
        default: false
    },
    circuitDraw: {
        type: String,
        required: false
    }
});

// Index for efficient queries
messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });

const MessageInternal = mongoose.model('Message', messageSchema);

// Proxy to switch between real Mongoose model and Mock at runtime
module.exports = new Proxy(MessageInternal, {
    get: (target, prop) => {
        const isMock = process.env.USE_MOCK_DB === 'true';
        const model = isMock
            ? require('./inMemoryDb').Message
            : MessageInternal;
        return model[prop];
    },
    construct: (target, args) => {
        const isMock = process.env.USE_MOCK_DB === 'true';
        const Model = isMock
            ? require('./inMemoryDb').Message
            : MessageInternal;
        return new Model(...args);
    }
});
