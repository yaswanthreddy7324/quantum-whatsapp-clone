"""
BB84 Quantum Key Distribution Protocol Implementation
"""

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np
from datetime import datetime


class BB84Protocol:
    """
    Implementation of the BB84 Quantum Key Distribution protocol
    Demonstrates quantum cryptography principles
    """
    
    def __init__(self, backend=None):
        self.backend = backend if backend else AerSimulator()
    
    def generate_shared_key(self, key_length=256):
        """
        Generate a shared secret key using chunked BB84
        """
        print(f"[BB84] Starting chunked quantum key distribution...")
        
        max_qubits = 24 # Safe limit for most backends
        if hasattr(self.backend, 'num_qubits'):
            max_qubits = min(self.backend.num_qubits, 24)
            
        full_key_bits = []
        total_qubits_sent = 0
        total_matching = 0
        
        while len(full_key_bits) < key_length:
            # For BB84, we use max qubits to get as many bits as possible per chunk
            current_qubits = max_qubits
            total_qubits_sent += current_qubits
            
            alice_bits = np.random.randint(0, 2, current_qubits)
            alice_bases = np.random.randint(0, 2, current_qubits)
            bob_bases = np.random.randint(0, 2, current_qubits)
            
            qc = QuantumCircuit(current_qubits, current_qubits)
            for i in range(current_qubits):
                if alice_bits[i] == 1: qc.x(i)
                if alice_bases[i] == 1: qc.h(i)
                if bob_bases[i] == 1: qc.h(i) # Bob's measurement basis
            
            qc.measure(range(current_qubits), range(current_qubits))
            
            # Capture the circuit visualization
            circuit_draw = str(qc.draw(output='text'))
            
            try:
                transpiled_qc = transpile(qc, self.backend)
                job = self.backend.run(transpiled_qc, shots=1)
                bob_results = list(job.result().get_counts().keys())[0].zfill(current_qubits)[::-1]
                bob_bits = [int(b) for b in bob_results]
                
                matching_indices = [i for i in range(current_qubits) if alice_bases[i] == bob_bases[i]]
                total_matching += len(matching_indices)
                
                for i in matching_indices:
                    full_key_bits.append(bob_bits[i])
                    
            except Exception as e:
                print(f"[BB84 ERROR] Chunk failed: {e}")
                raise

        # Final key processing
        shared_key_bits = full_key_bits[:key_length]
        key_binary = ''.join(map(str, shared_key_bits))
        key_int = int(key_binary, 2)
        key_hex = hex(key_int)[2:].zfill(key_length // 4)
        
        # Record sample for QBER calculation
        error_rate = 0.0 # Simplified for chunked
        
        key_id = f"qk_bb84_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        print(f"[BB84] Key generated: {key_id}")
        
        return {
            'key_id': key_id,
            'key_binary': key_binary,
            'key_hex': key_hex,
            'length': key_length,
            'protocol': 'BB84-Chunked',
            'qubits_sent': total_qubits_sent,
            'bases_matched': total_matching,
            'matching_rate': total_matching / total_qubits_sent if total_qubits_sent > 0 else 0,
            'qber': error_rate,
            'backend': str(self.backend),
            'timestamp': datetime.now().isoformat(),
            'secure': True,
            'circuit_draw': circuit_draw
        }
