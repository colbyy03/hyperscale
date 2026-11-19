import numpy as np


def _rates(C, K):
    d = 1.0 / np.sqrt(np.asarray(C, dtype=float))
    S = d[:, None] * np.asarray(K, dtype=float) * d[None, :]
    return np.linalg.eigvalsh(S)  # real, ascending


def time_constants(C, K):
    """Time constants (s) of C dT/dt = -K T, slowest first, as a real array."""
    return 1.0 / _rates(C, K)  # ascending rates -> descending time constants


def max_euler_step(C, K):
    """Largest stable forward-Euler time step (s): 2 / lambda_max."""
    return 2.0 / _rates(C, K).max()
