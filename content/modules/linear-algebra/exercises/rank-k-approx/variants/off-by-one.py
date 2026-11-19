# expect: Frobenius error of the rank-3 approximation
import numpy as np


def truncate(A, k):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return (U[:, : k + 1] * s[: k + 1]) @ Vt[: k + 1]


def rank_for_energy(A, fraction):
    s = np.linalg.svd(A, compute_uv=False)
    e = np.cumsum(s**2) / np.sum(s**2)
    return int(np.argmax(e >= fraction - 1e-12)) + 1
