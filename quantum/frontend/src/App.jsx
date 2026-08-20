import { useState, useEffect } from 'react';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import ShorFactorizer from './components/ShorFactorizer';
import './components/ShorFactorizer.css';

function App() {
    const [user, setUser] = useState(null);
    const [showShor, setShowShor] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
    };

    return (
        <div className="app">
            {user && (
                <div className="quantum-lab-toggle">
                    <button onClick={() => setShowShor(!showShor)} className="debug-btn">
                        {showShor ? "Back to Chat" : "Open Quantum Lab 🔬"}
                    </button>
                </div>
            )}

            {user ? (
                showShor ? (
                    <ShorFactorizer />
                ) : (
                    <ChatRoom user={user} onLogout={handleLogout} />
                )
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;
