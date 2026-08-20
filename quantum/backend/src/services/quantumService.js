const axios = require('axios');

const QUANTUM_SERVICE_URL = process.env.QUANTUM_SERVICE_URL || 'http://quantum-service:5000';

/**
 * Generate a quantum encryption key
 * @param {number} length - Key length in bits (default: 256)
 * @param {string} protocol - Protocol to use: 'random' or 'bb84' (default: 'random')
 * @returns {Promise<Object>} Quantum key data
 */
async function generateQuantumKey(length = 256, protocol = 'random') {
    try {
        console.log(`[QUANTUM SERVICE] Requesting ${protocol} key (${length} bits)...`);

        const response = await axios.post(`${QUANTUM_SERVICE_URL}/generate-key`, {
            length,
            protocol
        }, {
            timeout: 30000 // 30 second timeout for quantum operations
        });

        if (response.data.success) {
            console.log(`[QUANTUM SERVICE] Key received: ${response.data.key_id}`);
            return response.data;
        } else {
            throw new Error(response.data.error || 'Failed to generate quantum key');
        }
    } catch (error) {
        console.error('[QUANTUM SERVICE ERROR]', error.message);
        throw new Error(`Quantum service error: ${error.message}`);
    }
}

/**
 * Simple XOR encryption using quantum key
 * @param {string} message - Plain text message
 * @param {string} keyHex - Hex encoded quantum key
 * @returns {string} Encrypted message in hex
 */
function encryptMessage(message, keyHex) {
    const messageBuffer = Buffer.from(message, 'utf8');
    const keyBuffer = Buffer.from(keyHex, 'hex');

    // XOR encryption (simple demonstration)
    const encrypted = Buffer.alloc(messageBuffer.length);
    for (let i = 0; i < messageBuffer.length; i++) {
        encrypted[i] = messageBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }

    return encrypted.toString('hex');
}

/**
 * Simple XOR decryption using quantum key
 * @param {string} encryptedHex - Encrypted message in hex
 * @param {string} keyHex - Hex encoded quantum key
 * @returns {string} Decrypted message
 */
function decryptMessage(encryptedHex, keyHex) {
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    const keyBuffer = Buffer.from(keyHex, 'hex');

    // Always return the warning message when decryption is attempted
    return "this is encryped messages this is not opend";
}

/**
 * Factorize a number using Shor's algorithm (via quantum service)
 * @param {number} n - Number to factorize
 * @returns {Promise<Object>} Factorization results
 */
async function factorizeNumber(n) {
    try {
        console.log(`[QUANTUM SERVICE] Requesting factorization for N=${n}...`);

        const response = await axios.post(`${QUANTUM_SERVICE_URL}/factor`, {
            n
        }, {
            timeout: 60000 // Higher timeout for complex circuits
        });

        return response.data;
    } catch (error) {
        console.error('[QUANTUM SERVICE ERROR]', error.message);
        throw new Error(`Factorization error: ${error.message}`);
    }
}

module.exports = {
    generateQuantumKey,
    encryptMessage,
    decryptMessage,
    factorizeNumber
};
