# expect: Frobenius error of the rank-3 approximation
import numpy as np


def truncate(A, k):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    if k == 0:
        return np.zeros_like(A)
    return (U[:, -k:] * s[-k:]) @ Vt[-k:]


def rank_for_energy(A, fraction):
    s = np.linalg.svd(A, compute_uv=False)
    e = np.cumsum(s**2) / np.sum(s**2)
    return int(np.argmax(e >= fraction - 1e-12)) + 1
