import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function Login({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
            const payload = isRegister
                ? formData
                : { username: formData.username, password: formData.password };

            const response = await axios.post(`${API_URL}${endpoint}`, payload);

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onLogin(response.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>⚛️ Quantum Chat</h1>
                    <p>Secured by Quantum Cryptography</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    {isRegister && (
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    )}

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                    />

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}
                    </button>
                </form>

                <div className="login-footer">
                    <button
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                        }}
                        className="btn-link"
                    >
                        {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;
