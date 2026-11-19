# expect: the bump should score far higher
import numpy as np


def fit(X, ridge=1e-6):
    X = np.asarray(X, dtype=float)
    S = np.cov(X, rowvar=False)
    p = S.shape[0]
    return X.mean(axis=0), np.linalg.cholesky(S + ridge * np.trace(S) / p * np.eye(p))


def distances(Y, mu, L):
    return np.linalg.norm(np.atleast_2d(Y) - mu, axis=1) / np.sqrt(np.trace(L @ L.T) / L.shape[0])
