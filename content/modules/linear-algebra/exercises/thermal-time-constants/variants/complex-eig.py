# expect: return real time constants
import numpy as np


def time_constants(C, K):
    lam = np.linalg.eigvals(np.diag(1 / np.asarray(C, dtype=float)) @ K).astype(complex)
    return np.sort_complex(1 / lam)[::-1]


def max_euler_step(C, K):
    lam = np.linalg.eigvals(np.diag(1 / np.asarray(C, dtype=float)) @ K).real
    return 2.0 / lam.max()
