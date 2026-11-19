import numpy as np


def back_substitute(R, b):
    """Solve R x = b for upper-triangular R, from the last row up."""
    R = np.asarray(R, dtype=float)
    b = np.asarray(b, dtype=float)
    n = len(b)
    x = np.zeros(n)
    for k in range(n - 1, -1, -1):
        x[k] = (b[k] - R[k, k + 1 :] @ x[k + 1 :]) / R[k, k]
    return x


def lstsq_qr(X, y):
    """Least-squares coefficients minimizing ||X w - y||, via QR."""
    Q, R = np.linalg.qr(np.asarray(X, dtype=float))
    return back_substitute(R, Q.T @ np.asarray(y, dtype=float))
