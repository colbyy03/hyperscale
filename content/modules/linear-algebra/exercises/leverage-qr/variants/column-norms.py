# expect: leverages(X)
import numpy as np


def leverages(X):
    Q, _ = np.linalg.qr(X)
    return np.sum(Q**2, axis=0)


def high_leverage(X, factor=2.0):
    n, p = np.shape(X)
    h = leverages(X)
    idx = np.flatnonzero(h > factor * p / n)
    return idx[np.argsort(-h[idx], kind="stable")]
