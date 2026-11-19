# expect: something n × n was formed
import numpy as np


def leverages(X):
    return np.diag(X @ np.linalg.inv(X.T @ X) @ X.T).copy()


def high_leverage(X, factor=2.0):
    n, p = np.shape(X)
    h = leverages(X)
    idx = np.flatnonzero(h > factor * p / n)
    return idx[np.argsort(-h[idx], kind="stable")]
