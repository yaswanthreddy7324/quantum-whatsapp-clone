import React, { useState } from 'react';
import axios from 'axios';
import './ShorFactorizer.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ShorFactorizer = () => {
    const [number, setNumber] = useState(15);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFactorize = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const response = await axios.post(`${API_URL}/api/quantum/factor`, { n: number });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to connect to Quantum Service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="shor-container">
            <div className="shor-card">
                <h1 className="shor-title">🔬 Shor's Algorithm</h1>
                <p className="shor-subtitle">Quantum Integer Factorization</p>

                <div className="input-group">
                    <input
                        type="number"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="shor-input"
                        placeholder="Enter N (e.g., 15)"
                    />
                    <button
                        onClick={handleFactorize}
                        disabled={loading}
                        className="shor-button"
                    >
                        {loading ? 'Processing...' : 'Factorize Quantumly'}
                    </button>
                </div>

                {loading && (
                    <div className="loading-animation">
                        <div className="quantum-spinner"></div>
                        <p>Simulating Quantum Superposition...</p>
                    </div>
                )}

                {error && <div className="shor-error">{error}</div>}

                {result && (
                    <div className="shor-result fade-in">
                        <div className="result-header">
                            <h3>Success!</h3>
                            <span className="method-tag">{result.method}</span>
                        </div>
                        <div className="factors-display">
                            <span className="factor">{result.factors[0]}</span>
                            <span className="multiplier">×</span>
                            <span className="factor">{result.factors[1]}</span>
                            <span className="equals">=</span>
                            <span className="n-value">{result.n}</span>
                        </div>

                        <div className="educational-note" style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px', borderLeft: '4px solid #9c27b0', fontSize: '0.9em', color: '#555' }}>
                            <strong>🎓 Educational Note:</strong> This demonstrates that classical RSA encryption relies on the difficulty of integer factorization. Shor's Algorithm (running on a quantum computer) solves this efficiently, rendering classical RSA vulnerable.
                            <br /><br />
                            <em>Note: This simulation uses Qiskit on a classical processor.</em>
                        </div>

                        {result.circuit_draw && (
                            <div className="circuit-container">
                                <h4>Quantum Circuit Diagram</h4>
                                <pre className="circuit-text">{result.circuit_draw}</pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShorFactorizer;
