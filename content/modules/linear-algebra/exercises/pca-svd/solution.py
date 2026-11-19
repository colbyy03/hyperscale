import numpy as np


def pca(X, k):
    """PCA of snapshots X (n, p): returns (mean, components (k, p), explained (k,), scores (n, k))."""
    X = np.asarray(X, dtype=float)
    mean = X.mean(axis=0)
    Xc = X - mean
    _, S, Vt = np.linalg.svd(Xc, full_matrices=False)
    C = Vt[:k]
    big = np.abs(C).argmax(axis=1)
    C = C * np.sign(C[np.arange(k), big])[:, None]
    explained = (S**2 / np.sum(S**2))[:k]
    return mean, C, explained, Xc @ C.T
