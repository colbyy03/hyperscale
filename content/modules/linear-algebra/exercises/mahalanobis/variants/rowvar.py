# expect: pass rowvar=False to np.cov
import numpy as np


def fit(X, ridge=1e-6):
    X = np.asarray(X, dtype=float)
    S = np.cov(X)
    p = S.shape[0]
    return X.mean(axis=0), np.linalg.cholesky(S + ridge * np.trace(S) / p * np.eye(p))


def distances(Y, mu, L):
    Z = np.linalg.solve(L, (np.atleast_2d(Y) - mu).T)
    return np.sqrt(np.sum(Z**2, axis=0))
