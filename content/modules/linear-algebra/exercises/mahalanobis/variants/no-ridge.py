# expect: add the ridge before factoring
import numpy as np


def fit(X, ridge=1e-6):
    X = np.asarray(X, dtype=float)
    return X.mean(axis=0), np.linalg.cholesky(np.cov(X, rowvar=False))


def distances(Y, mu, L):
    Z = np.linalg.solve(L, (np.atleast_2d(Y) - mu).T)
    return np.sqrt(np.sum(Z**2, axis=0))
