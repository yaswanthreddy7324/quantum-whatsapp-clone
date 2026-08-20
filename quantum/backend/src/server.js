require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// Default to mock to avoid buffering during connection
process.env.USE_MOCK_DB = 'true';

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

// Models
const User = require('./models/User');
const Message = require('./models/Message');

// Services
const { generateQuantumKey, encryptMessage, factorizeNumber } = require('./services/quantumService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'quantum-whatsapp-backend' });
});

// Proxy for Shor's Factorization
app.post('/api/quantum/factor', async (req, res) => {
    try {
        const { n } = req.body;
        const result = await factorizeNumber(n);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum-chat';

let isUsingMockDB = true;
// process.env.USE_MOCK_DB = 'true'; // Moved to top

mongoose.set('bufferCommands', false); // Disable buffering

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
    .then(() => {
        console.log('✅ Connected to MongoDB. Switching to REAL DATABASE MODE.');
        process.env.USE_MOCK_DB = 'false';
        isUsingMockDB = false;
    })
    .catch((error) => {
        console.warn('⚠️  MONGODB CONNECTION FAILED. Staying in IN-MEMORY DEMO MODE.');
        // isUsingMockDB and USE_MOCK_DB are already set
    });

// Store active socket connections
const activeUsers = new Map(); // userId -> socketId

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log(`\n[SOCKET] New connection: ${socket.id}`);

    // User joins with their user ID
    socket.on('user-connected', async (userData) => {
        const { userId, username } = userData;
        activeUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.username = username;

        console.log(`[SOCKET] User connected: ${username} (${userId})`);

        // Update user's last seen
        try {
            await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
        } catch (error) {
            console.error('[SOCKET ERROR] Failed to update last seen:', error);
        }

        // Broadcast online users
        io.emit('user-status', {
            userId,
            username,
            status: 'online'
        });
    });

    // Handle sending messages
    socket.on('send-message', async (messageData) => {
        try {
            const { senderId, senderUsername, receiverId, receiverUsername, message } = messageData;

            console.log(`\n[MESSAGE] ${senderUsername} → ${receiverUsername}`);
            console.log(`[MESSAGE] Content: "THIS IS ENCRIPTED MESSAGES DO NOT OPENED"`);

            // Step 1: Generate quantum encryption key
            console.log('[QUANTUM] Requesting quantum key...');
            const quantumKeyData = await generateQuantumKey(256, 'bb84');

            console.log(`[QUANTUM] Key generated: ${quantumKeyData.key_id}`);
            console.log(`[QUANTUM] Protocol: ${quantumKeyData.metadata.protocol}`);
            if (quantumKeyData.metadata.qber !== undefined) {
                console.log(`[QUANTUM] QBER: ${quantumKeyData.metadata.qber.toFixed(4)}`);
            }

            // Step 2: Encrypt message with quantum key
            const encryptedMessage = encryptMessage(message, quantumKeyData.key);

            console.log(`[ENCRYPTED] Sender: ${senderUsername} | Receiver: ${receiverUsername}`);
            console.log(`[ENCRYPTED] Message: ${encryptedMessage.substring(0, 50)}...`);
            console.log(`[ENCRYPTED] Key ID: ${quantumKeyData.key_id}`);

            // Step 3: Save to database
            const newMessage = new Message({
                sender: senderId,
                senderUsername,
                receiver: receiverId,
                receiverUsername,
                encryptedMessage,
                quantumKeyId: quantumKeyData.key_id,
                circuitDraw: quantumKeyData.metadata.circuit_draw,
                timestamp: new Date()
            });

            await newMessage.save();
            console.log('[DATABASE] Message saved');

            // Step 4: Send to receiver via Socket.IO
            const receiverSocketId = activeUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive-message', {
                    id: newMessage._id,
                    senderId,
                    senderUsername,
                    message, // Send decrypted message to receiver
                    timestamp: newMessage.timestamp,
                    encryptedMessage,
                    quantumKeyId: quantumKeyData.key_id,
                    circuitDraw: quantumKeyData.metadata.circuit_draw
                });

                // Mark as delivered
                newMessage.delivered = true;
                await newMessage.save();

                console.log(`[SOCKET] Message delivered to ${receiverUsername}`);
            } else {
                console.log(`[SOCKET] ${receiverUsername} (ID: ${receiverId}) is offline. Msg stored.`);
                console.log(`[SOCKET] Active users: ${Array.from(activeUsers.keys()).join(', ')}`);
            }

            // Step 5: Send confirmation to sender
            socket.emit('message-sent', {
                id: newMessage._id,
                success: true,
                timestamp: newMessage.timestamp,
                quantumKeyId: quantumKeyData.key_id,
                circuitDraw: quantumKeyData.metadata.circuit_draw
            });

            console.log('[SOCKET] Message flow completed ✓\n');

        } catch (error) {
            console.error('[MESSAGE ERROR]', error);
            socket.emit('message-error', {
                error: 'Failed to send message',
                details: error.message
            });
        }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        const { receiverId, senderUsername } = data;
        const receiverSocketId = activeUsers.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user-typing', {
                username: senderUsername
            });
        }
    });

    // Handle stop typing
    socket.on('stop-typing', (data) => {
        const { receiverId } = data;
        const receiverSocketId = activeUsers.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user-stop-typing');
        }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        if (socket.userId) {
            activeUsers.delete(socket.userId);

            console.log(`[SOCKET] User disconnected: ${socket.username}`);

            // Update last seen
            try {
                await User.findByIdAndUpdate(socket.userId, { lastSeen: Date.now() });
            } catch (error) {
                console.error('[SOCKET ERROR] Failed to update last seen:', error);
            }

            // Broadcast offline status
            io.emit('user-status', {
                userId: socket.userId,
                username: socket.username,
                status: 'offline'
            });
        }
    });
});

// Start server
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 QUANTUM WHATSAPP BACKEND SERVER');
    console.log('='.repeat(60));
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB: ${MONGODB_URI}`);
    console.log(`Quantum Service: ${process.env.QUANTUM_SERVICE_URL}`);
    console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('Server closed');
            process.exit(0);
        });
    });
});
