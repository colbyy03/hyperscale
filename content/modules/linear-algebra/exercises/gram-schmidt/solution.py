import numpy as np


def mgs_qr(A):
    """Thin QR of A by modified Gram-Schmidt: returns Q (m, n) and R (n, n) with A = Q @ R."""
    V = np.asarray(A, dtype=float).copy()
    m, n = V.shape
    Q = np.zeros((m, n))
    R = np.zeros((n, n))
    for j in range(n):
        R[j, j] = np.linalg.norm(V[:, j])
        Q[:, j] = V[:, j] / R[j, j]
        R[j, j + 1 :] = Q[:, j] @ V[:, j + 1 :]
        V[:, j + 1 :] -= np.outer(Q[:, j], R[j, j + 1 :])
    return Q, R
