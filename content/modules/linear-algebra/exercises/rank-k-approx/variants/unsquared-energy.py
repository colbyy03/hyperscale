# expect: Energy uses squared singular values
import numpy as np


def truncate(A, k):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return (U[:, :k] * s[:k]) @ Vt[:k]


def rank_for_energy(A, fraction):
    s = np.linalg.svd(A, compute_uv=False)
    e = np.cumsum(s) / np.sum(s)
    return int(np.argmax(e >= fraction - 1e-12)) + 1
