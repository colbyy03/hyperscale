import numpy as np


def truncate(A, k):
    """Best rank-k approximation of A (keep the k largest singular values)."""
    U, s, Vt = np.linalg.svd(np.asarray(A, dtype=float), full_matrices=False)
    return (U[:, :k] * s[:k]) @ Vt[:k]


def rank_for_energy(A, fraction):
    """Smallest k whose squared singular values capture at least `fraction` of the total."""
    s = np.linalg.svd(np.asarray(A, dtype=float), compute_uv=False)
    e = np.cumsum(s**2) / np.sum(s**2)
    return int(np.argmax(e >= fraction - 1e-12)) + 1
