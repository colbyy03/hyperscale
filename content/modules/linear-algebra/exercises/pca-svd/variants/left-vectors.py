# expect: components
import numpy as np


def pca(X, k):
    X = np.asarray(X, dtype=float)
    mean = X.mean(axis=0)
    Xc = X - mean
    U, S, Vt = np.linalg.svd(Xc, full_matrices=False)
    C = U[:, :k].T
    return mean, C, (S**2 / np.sum(S**2))[:k], U[:, :k] * S[:k]
