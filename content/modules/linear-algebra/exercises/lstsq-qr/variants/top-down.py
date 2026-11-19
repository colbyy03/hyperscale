# expect: back_substitute on the 3×3 example
import numpy as np


def back_substitute(R, b):
    n = len(b)
    x = np.zeros(n)
    for k in range(n):
        x[k] = (b[k] - R[k, :k] @ x[:k]) / R[k, k]
    return x


def lstsq_qr(X, y):
    Q, R = np.linalg.qr(X)
    return back_substitute(R, Q.T @ y)
