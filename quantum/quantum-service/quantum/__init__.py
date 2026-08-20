"""
Quantum package initialization
"""

from .key_generator import QuantumKeyGenerator
from .bb84 import BB84Protocol

__all__ = ['QuantumKeyGenerator', 'BB84Protocol']
