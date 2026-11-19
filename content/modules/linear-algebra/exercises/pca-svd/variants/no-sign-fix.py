# expect: largest-magnitude entry of each component should be positive
import numpy as np


def pca(X, k):
    X = np.asarray(X, dtype=float)
    mean = X.mean(axis=0)
    Xc = X - mean
    _, S, Vt = np.linalg.svd(Xc, full_matrices=False)
    C = -Vt[:k]
    return mean, C, (S**2 / np.sum(S**2))[:k], Xc @ C.T
