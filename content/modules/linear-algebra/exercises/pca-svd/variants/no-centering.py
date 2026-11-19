# expect: Subtract each sensor's mean before the SVD
import numpy as np


def pca(X, k):
    X = np.asarray(X, dtype=float)
    _, S, Vt = np.linalg.svd(X, full_matrices=False)
    C = Vt[:k]
    big = np.abs(C).argmax(axis=1)
    C = C * np.sign(C[np.arange(k), big])[:, None]
    return X.mean(axis=0), C, (S**2 / np.sum(S**2))[:k], X @ C.T
