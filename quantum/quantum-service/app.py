"""
Quantum Key Generation Service
Flask API for generating quantum encryption keys using Qiskit
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from quantum.key_generator import QuantumKeyGenerator
from quantum.bb84 import BB84Protocol
from quantum.shor import ShorAlgorithm
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get IBM Quantum API key from environment
IBM_API_KEY = os.getenv('IBM_QUANTUM_API_KEY')

# Initialize quantum key generator
print("[QUANTUM SERVICE] Initializing quantum key generator...")

if IBM_API_KEY and IBM_API_KEY != 'p_ZV_kah_dnwfYRdbLtAMv0W80z5Ll1wMZh_1wO0jd4N':
    print("[QUANTUM SERVICE] IBM Quantum API key found")
    # IBM Quantum backend enabled
    key_generator = QuantumKeyGenerator(use_ibm_backend=True, api_key=IBM_API_KEY)
else:
    print("[QUANTUM SERVICE] No API key found, using local simulator only")
    key_generator = QuantumKeyGenerator(use_ibm_backend=False)

print("[QUANTUM SERVICE] Quantum service ready!")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'quantum-key-generator',
        'backend': str(key_generator.backend)
    }), 200


@app.route('/generate-key', methods=['POST'])
def generate_key():
    """
    Generate a quantum encryption key
    
    Request body (optional):
        {
            "length": 256,  // Key length in bits (default: 256)
            "protocol": "bb84"  // Protocol: "random" or "bb84" (default: "random")
        }
    
    Returns:
        {
            "success": true,
            "key": "hex_encoded_key",
            "key_id": "unique_key_identifier",
            "metadata": { ... }
        }
    """
    try:
        # Get request parameters
        data = request.get_json() or {}
        key_length = data.get('length', 256)
        protocol = data.get('protocol', 'random').lower()
        
        print(f"\n[API] Received key generation request")
        print(f"[API] Length: {key_length} bits, Protocol: {protocol}")
        
        # Validate key length
        if key_length < 8 or key_length > 512:
            return jsonify({
                'success': False,
                'error': 'Key length must be between 8 and 512 bits'
            }), 400
        
        # Generate key based on protocol
        if protocol == 'bb84':
            bb84 = BB84Protocol(backend=key_generator.backend)
            result = bb84.generate_shared_key(key_length=key_length)
        else:
            result = key_generator.generate_random_key(num_bits=key_length)
        
        # Prepare response (without exposing full key in logs)
        print(f"[API] Key generated successfully: {result['key_id']}")
        print(f"[API] Key length: {result['length']} bits")
        
        return jsonify({
            'success': True,
            'key': result['key_hex'],
            'key_id': result['key_id'],
            'metadata': {
                'length': result['length'],
                'protocol': result.get('protocol', 'random'),
                'backend': result['backend'],
                'timestamp': result['timestamp'],
                'qber': result.get('qber'),  # Only for BB84
                'matching_rate': result.get('matching_rate'),  # Only for BB84
                'circuit_draw': result.get('circuit_draw')
            }
        }), 200
        
    except Exception as e:
        print(f"[API ERROR] Failed to generate key: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/factor', methods=['POST'])
def factor_number():
    """
    Factorize a number using Shor's algorithm demonstration
    
    Request body:
        {
            "n": 15
        }
    """
    try:
        data = request.get_json() or {}
        n = data.get('n')
        
        if not n:
            return jsonify({'success': False, 'error': 'Number N is required'}), 400
            
        print(f"\n[API] Received factorization request for N={n}")
        
        shor = ShorAlgorithm(backend=key_generator.backend)
        result = shor.get_factors(int(n))
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"[API ERROR] Factorization failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/test', methods=['GET'])
def test_quantum():
    """
    Test endpoint to verify quantum service is working
    Generates a small test key
    """
    try:
        print("\n[TEST] Running quantum service test...")
        result = key_generator.generate_random_key(num_bits=32)
        
        return jsonify({
            'success': True,
            'message': 'Quantum service is operational',
            'test_key_id': result['key_id'],
            'backend': result['backend']
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🔬 QUANTUM KEY GENERATION SERVICE")
    print("="*60)
    print(f"Backend: {key_generator.backend}")
    print(f"IBM Quantum enabled: {key_generator.use_ibm_backend}")
    print(f"API Key configured: {bool(IBM_API_KEY and IBM_API_KEY != 'p_ZV_kah_dnwfYRdbLtAMv0W80z5Ll1wMZh_1wO0jd4N')}")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
