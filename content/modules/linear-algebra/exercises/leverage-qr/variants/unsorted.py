# expect: from highest leverage down
import numpy as np


def leverages(X):
    Q, _ = np.linalg.qr(X)
    return np.sum(Q**2, axis=1)


def high_leverage(X, factor=2.0):
    n, p = np.shape(X)
    h = leverages(X)
    idx = np.flatnonzero(h > factor * p / n)
    order = np.argsort(-h[idx], kind="stable")
    return np.concatenate([idx[order][:1], np.sort(idx[order][1:])])
