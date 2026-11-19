import numpy as np


def leverages(X):
    """Diagonal of the hat matrix X (X^T X)^-1 X^T, computed through a thin QR."""
    Q, _ = np.linalg.qr(np.asarray(X, dtype=float))
    return np.sum(Q**2, axis=1)


def high_leverage(X, factor=2.0):
    """Indices of readings with leverage above factor * p / n, highest first."""
    n, p = np.shape(X)
    h = leverages(X)
    idx = np.flatnonzero(h > factor * p / n)
    return idx[np.argsort(-h[idx], kind="stable")]
