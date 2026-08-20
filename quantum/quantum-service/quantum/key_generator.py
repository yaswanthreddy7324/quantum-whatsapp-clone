"""
Quantum Key Generator using Qiskit
Generates cryptographic keys using quantum randomness
"""

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np
from datetime import datetime


class QuantumKeyGenerator:
    def __init__(self, use_ibm_backend=False, api_key=None):
        """
        Initialize the quantum key generator
        
        Args:
            use_ibm_backend: Whether to use IBM Quantum hardware (requires API key)
            api_key: IBM Quantum API key
        """
        self.use_ibm_backend = use_ibm_backend
        self.api_key = api_key
        
        # Use local simulator by default
        self.backend = AerSimulator()
        
        # If IBM backend requested and API key provided
        if use_ibm_backend and api_key:
            try:
                from qiskit_ibm_runtime import QiskitRuntimeService
                service = QiskitRuntimeService(channel="ibm_quantum", token=api_key)
                # Use least busy backend or simulator
                self.backend = service.least_busy(simulator=False, operational=True)
                print(f"[QUANTUM] Using IBM Quantum backend: {self.backend.name}")
            except Exception as e:
                print(f"[QUANTUM] Failed to connect to IBM Quantum, using local simulator: {e}")
                self.backend = AerSimulator()

    def get_max_qubits(self):
        """Helper to get max bits supported by current backend"""
        try:
            # Most local simulators handle at least 24 bits effectively
            # Real backends vary, but we'll cap at 24 for stability
            return min(self.backend.num_qubits, 24) if hasattr(self.backend, 'num_qubits') else 24
        except:
            return 24
    
    def generate_random_key(self, num_bits=256):
        """
        Generate a random key using quantum superposition and measurement
        
        Args:
            num_bits: Number of bits in the key (default 256)
        """
        print(f"[QUANTUM] Generating quantum random key with {num_bits} bits...")
        
        max_chunk = self.get_max_qubits()
        full_key_binary = ""
        
        while len(full_key_binary) < num_bits:
            current_chunk_size = min(max_chunk, num_bits - len(full_key_binary))
            
            # Create quantum circuit for this chunk
            qc = QuantumCircuit(current_chunk_size, current_chunk_size)
            for i in range(current_chunk_size):
                qc.h(i)
            qc.measure(range(current_chunk_size), range(current_chunk_size))
            
            # Capture the circuit visualization
            circuit_draw = str(qc.draw(output='text'))
            
            # Run
            try:
                transpiled_qc = transpile(qc, self.backend)
                job = self.backend.run(transpiled_qc, shots=1)
                result = job.result()
                counts = result.get_counts()
                
                # Get bit string
                chunk_binary = list(counts.keys())[0].zfill(current_chunk_size)
                full_key_binary += chunk_binary
            except Exception as e:
                print(f"[QUANTUM ERROR] Chunk generation failed: {e}")
                raise
        
        # Trim to exact length
        full_key_binary = full_key_binary[:num_bits]
        
        # Convert to hex
        key_int = int(full_key_binary, 2)
        key_hex = hex(key_int)[2:].zfill(num_bits // 4)
        
        print(f"[QUANTUM] Key generated successfully ({num_bits} bits)")
        key_id = f"qk_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        
        return {
            'key_id': key_id,
            'key_binary': full_key_binary,
            'key_hex': key_hex,
            'length': num_bits,
            'backend': str(self.backend),
            'timestamp': datetime.now().isoformat(),
            'circuit_draw': circuit_draw
        }
    
    def generate_key_bb84_style(self, num_bits=256):
        """
        Simplified BB84-inspired key generation (Chunked)
        """
        print(f"[QUANTUM] Generating BB84-style quantum key with {num_bits} bits...")
        
        max_chunk = self.get_max_qubits()
        full_key_binary = ""
        total_matching = 0
        
        while len(full_key_binary) < num_bits:
            current_chunk_size = min(max_chunk, num_bits - len(full_key_binary))
            
            alice_bits = np.random.randint(0, 2, current_chunk_size)
            alice_bases = np.random.randint(0, 2, current_chunk_size)
            bob_bases = np.random.randint(0, 2, current_chunk_size)
            
            qc = QuantumCircuit(current_chunk_size, current_chunk_size)
            for i in range(current_chunk_size):
                if alice_bits[i] == 1: qc.x(i)
                if alice_bases[i] == 1: qc.h(i)
                if bob_bases[i] == 1: qc.h(i)
            
            qc.measure(range(current_chunk_size), range(current_chunk_size))
            
            # Capture the circuit visualization
            circuit_draw = str(qc.draw(output='text'))
            
            try:
                transpiled_qc = transpile(qc, self.backend)
                job = self.backend.run(transpiled_qc, shots=1)
                result = job.result()
                counts = result.get_counts()
                measured_bits = list(counts.keys())[0].zfill(current_chunk_size)[::-1]
                
                matching_bases = (alice_bases == bob_bases)
                chunk_key = "".join([measured_bits[i] for i in range(current_chunk_size) if matching_bases[i]])
                
                full_key_binary += chunk_key
                total_matching += np.sum(matching_bases)
                
                # If we don't have enough bits yet, the loop continues
                # Note: This simple version might be slow if matching rate is low, 
                # but for 50% match it's fine.
            except Exception as e:
                print(f"[QUANTUM ERROR] BB84 chunk failed: {e}")
                raise

        full_key_binary = full_key_binary[:num_bits]
        key_int = int(full_key_binary, 2)
        key_hex = hex(key_int)[2:].zfill(num_bits // 4)
        key_id = f"qk_bb84_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        
        print(f"[QUANTUM] BB84 key generated ({num_bits} bits)")
        
        return {
            'key_id': key_id,
            'key_binary': full_key_binary,
            'key_hex': key_hex,
            'length': num_bits,
            'protocol': 'BB84-Simple',
            'matching_bases': total_matching,
            'backend': str(self.backend),
            'timestamp': datetime.now().isoformat(),
            'circuit_draw': circuit_draw
        }
