# expect: explained variance fractions
import numpy as np


def pca(X, k):
    X = np.asarray(X, dtype=float)
    mean = X.mean(axis=0)
    Xc = X - mean
    _, S, Vt = np.linalg.svd(Xc, full_matrices=False)
    C = Vt[:k]
    big = np.abs(C).argmax(axis=1)
    C = C * np.sign(C[np.arange(k), big])[:, None]
    return mean, C, (S / np.sum(S))[:k], Xc @ C.T
