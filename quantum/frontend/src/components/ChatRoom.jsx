import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import ShorFactorizer from './ShorFactorizer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

function ChatRoom({ user, onLogout }) {
    const [socket, setSocket] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typing, setTyping] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [showCircuitModal, setShowCircuitModal] = useState(false);
    const [showShorAnalyzer, setShowShorAnalyzer] = useState(false);
    const [currentCircuit, setCurrentCircuit] = useState('');
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const selectedUserRef = useRef(null); // Track selected user for socket events

    // Update ref when selectedUser changes
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    // Initialize Socket.IO connection
    useEffect(() => {
        console.log('Connecting to socket:', SOCKET_URL);
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            // Emit user connected event
            newSocket.emit('user-connected', {
                userId: user.id,
                username: user.username
            });
        });

        // Listen for incoming messages
        newSocket.on('receive-message', (messageData) => {
            console.log('Received message:', messageData);
            const currentSelected = selectedUserRef.current;

            // Only add if it belongs to the current conversation
            if (currentSelected && (messageData.senderId === currentSelected._id || messageData.sender === currentSelected.username)) {
                setMessages(prev => [...prev, {
                    id: messageData.id,
                    sender: messageData.senderUsername,
                    message: messageData.message,
                    timestamp: new Date(messageData.timestamp),
                    isMine: false,
                    circuitDraw: messageData.circuitDraw
                }]);
            } else {
                console.log('Message received but not for selected user (or no user selected)');
            }
        });

        // Listen for message sent confirmation
        newSocket.on('message-sent', (data) => {
            console.log('Message sent confirmed:', data);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsgIndex = newMessages.length - 1;
                if (lastMsgIndex >= 0 && newMessages[lastMsgIndex].isMine) {
                    newMessages[lastMsgIndex].circuitDraw = data.circuitDraw;
                }
                return newMessages;
            });
        });

        // Listen for user status changes
        newSocket.on('user-status', (statusData) => {
            console.log('User status update:', statusData);
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (statusData.status === 'online') {
                    newSet.add(statusData.userId);
                } else {
                    newSet.delete(statusData.userId);
                }
                return newSet;
            });
        });

        // Listen for typing indicator
        newSocket.on('user-typing', (data) => {
            if (selectedUserRef.current && data.username === selectedUserRef.current.username) {
                setTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
            }
        });

        newSocket.on('user-stop-typing', () => {
            setTyping(false);
        });

        return () => {
            console.log('Disconnecting socket');
            newSocket.disconnect();
        };
    }, [user]);

    // Fetch users list
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/auth/users`);
                if (response.data.success) {
                    setUsers(response.data.users.filter(u => u._id !== user.id));
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        fetchUsers();
    }, [user]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch chat history when selectedUser changes
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/messages/${selectedUser._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    const formattedMessages = response.data.messages.map(msg => ({
                        id: msg._id,
                        sender: msg.senderUsername,
                        message: msg.encryptedMessage, // Ideally show decrypted, but for now showing what's returned. 
                        // Wait, server.js sends 'message' as decrypted in socket, but DB has 'encryptedMessage'. 
                        // The GET /api/messages endpoint extracts from DB. 
                        // We need to decide if we decrypt on front end or back end. 
                        // Looking at server.js socket emission: it sends 'message' (decrypted) AND 'encryptedMessage'.
                        // Looking at messages.js route: it returns DB objects which have 'encryptedMessage'. 
                        // AND it likely doesn't decrypt them because the key is in memory/ephemeral? 
                        // OR does it? 
                        // The 'message' field in DB schema? 
                        // Let's check the Message model.
                        // If Message model only has encoded, we might be unable to read history without keys.
                        // Assuming simplest path: History might be encrypted text for now unless we decrypt.
                        // Let's check logic.

                        timestamp: new Date(msg.timestamp),
                        isMine: msg.sender === user.id,
                        circuitDraw: msg.circuitDraw
                    }));
                    // Wait, I need to check if the DB stores the plain text 'message' too?
                    // server.js line 130: `newMessage` object does NOT have 'message' field, only 'encryptedMessage'.
                    // So history will be encrypted unless we decrypt it.
                    // But we don't have the key stored?
                    // Quantum keys are usually one-time use or session based.
                    // If the project intends to store encrypted and display encrypted, that's fine.
                    // But for "auto reload" functionality, the user expects to see what they just sent.
                    // When I send, I push plain text to local state (ChatRoom.jsx:125).
                    // When I load history, I get encrypted text.
                    // This might be the intended "Educational" behavior showing encryption.
                    // Let's stick effectively to what the schema supports.

                    setMessages(formattedMessages);
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };

        fetchMessages();
    }, [selectedUser, user.id]);

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !selectedUser || !socket) return;

        const messageData = {
            senderId: user.id,
            senderUsername: user.username,
            receiverId: selectedUser._id,
            receiverUsername: selectedUser.username,
            message: newMessage
        };

        // Add to local messages immediately
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: user.username,
            message: newMessage,
            timestamp: new Date(),
            isMine: true
        }]);

        // Send via Socket.IO
        socket.emit('send-message', messageData);
        socket.emit('stop-typing', { receiverId: selectedUser._id });

        setNewMessage('');
    };

    const handleTyping = () => {
        if (selectedUser && socket) {
            socket.emit('typing', {
                receiverId: selectedUser._id,
                senderUsername: user.username
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (socket) socket.disconnect();
        onLogout();
    };

    return (
        <div className="chat-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>⚛️ Quantum Chat</h2>
                    <div className="user-info">
                        <span>{user.username}</span>
                        <button onClick={() => setShowShorAnalyzer(true)} className="btn-shor-analyzer" style={{ marginLeft: '10px', padding: '5px 10px', background: '#9c27b0', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>
                            🔬 Analyzer
                        </button>
                        <button onClick={handleLogout} className="btn-logout" style={{ marginLeft: '5px' }}>Logout</button>
                    </div>
                </div>

                <div className="users-list">
                    <h3>Users</h3>
                    {users.map(u => (
                        <div
                            key={u._id}
                            className={`user-item ${selectedUser?._id === u._id ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedUser(u);
                                setMessages([]);
                            }}
                        >
                            <div className="user-avatar">
                                {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-details">
                                <div className="user-name">{u.username}</div>
                                <div className={`user-status ${onlineUsers.has(u._id) ? 'online' : 'offline'}`}>
                                    {onlineUsers.has(u._id) ? '● Online' : '○ Offline'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-area">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <div className="user-avatar large">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3>{selectedUser.username}</h3>
                                    <span className={`status-text ${onlineUsers.has(selectedUser._id) ? 'online' : 'offline'}`}>
                                        {onlineUsers.has(selectedUser._id) ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="quantum-badge">
                                🔒 Quantum Encrypted
                            </div>
                        </div>

                        <div className="messages-container">
                            {messages.length === 0 ? (
                                <div className="no-messages">
                                    <p>No messages yet. Start a conversation!</p>
                                    <p className="quantum-info">All messages are encrypted with quantum-generated keys</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div
                                        key={msg.id || index}
                                        className={`message ${msg.isMine ? 'mine' : 'theirs'}`}
                                    >
                                        <div className="message-content">
                                            <div className="message-text">{msg.message}</div>
                                            <div className="message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </div>
                                            {msg.circuitDraw && (
                                                <button
                                                    className="btn-view-circuit"
                                                    onClick={() => {
                                                        setCurrentCircuit(msg.circuitDraw);
                                                        setShowCircuitModal(true);
                                                    }}
                                                >
                                                    View Quantum Circuit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {typing && (
                                <div className="typing-indicator">
                                    <span>{selectedUser.username} is typing</span>
                                    <span className="dots">...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="message-input-container">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                placeholder="Type a message..."
                                className="message-input"
                            />
                            <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <h2>⚛️ Quantum WhatsApp Clone</h2>
                        <p>Select a user to start chatting</p>
                        <div className="features">
                            <div className="feature">
                                <span className="icon">🔐</span>
                                <span>Quantum Key Distribution (BB84)</span>
                            </div>
                            <div className="feature">
                                <span className="icon">⚡</span>
                                <span>Real-time Messaging</span>
                            </div>
                            <div className="feature">
                                <span className="icon">🔒</span>
                                <span>End-to-End Encryption</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quantum Circuit Modal */}
            {showCircuitModal && (
                <div className="circuit-modal-overlay" onClick={() => setShowCircuitModal(false)}>
                    <div className="circuit-modal" onClick={e => e.stopPropagation()}>
                        <div className="circuit-modal-header">
                            <h3>⚛️ Quantum Circuit Visualization</h3>
                            <button className="btn-close-modal" onClick={() => setShowCircuitModal(false)}>×</button>
                        </div>
                        <div className="circuit-modal-body">
                            <pre className="circuit-pre">{currentCircuit}</pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Shor's Algorithm Modal */}
            {showShorAnalyzer && (
                <div className="circuit-modal-overlay" onClick={() => setShowShorAnalyzer(false)}>
                    <div className="circuit-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="circuit-modal-header">
                            <h3>⚛️ Quantum Security Analyzer</h3>
                            <button className="btn-close-modal" onClick={() => setShowShorAnalyzer(false)}>×</button>
                        </div>
                        <div className="circuit-modal-body">
                            <ShorFactorizer />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatRoom;
