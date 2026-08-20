const express = require('express');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * Get chat history between two users
 * GET /api/messages/:otherUserId
 */
router.get('/:otherUserId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.user;
        const { otherUserId } = req.params;

        // Find messages between the two users
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        })
            .sort({ timestamp: 1 })
            .limit(100); // Limit to last 100 messages

        res.json({ success: true, messages });
    } catch (error) {
        console.error('[MESSAGES ERROR]', error);
        res.status(500).json({ error: 'Server error fetching messages' });
    }
});

/**
 * Mark messages as read
 * PUT /api/messages/read/:otherUserId
 */
router.put('/read/:otherUserId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.user;
        const { otherUserId } = req.params;

        await Message.updateMany(
            { sender: otherUserId, receiver: userId, read: false },
            { read: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('[MESSAGES ERROR]', error);
        res.status(500).json({ error: 'Server error updating messages' });
    }
});

module.exports = router;
