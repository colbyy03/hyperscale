# expect: Q.T @ Q
import numpy as np


def mgs_qr(A):
    V = np.asarray(A, dtype=float).copy()
    m, n = V.shape
    Q = np.zeros((m, n))
    R = np.zeros((n, n))
    for j in range(n):
        R[j, j] = 1.0
        Q[:, j] = V[:, j]
        R[j, j + 1 :] = Q[:, j] @ V[:, j + 1 :] / (Q[:, j] @ Q[:, j])
        V[:, j + 1 :] -= np.outer(Q[:, j], R[j, j + 1 :])
    return Q, R
