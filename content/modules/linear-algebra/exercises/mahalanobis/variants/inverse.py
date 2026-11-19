# expect: instead of forming the inverse covariance
import numpy as np


def fit(X, ridge=1e-6):
    X = np.asarray(X, dtype=float)
    S = np.cov(X, rowvar=False)
    p = S.shape[0]
    return X.mean(axis=0), np.linalg.cholesky(S + ridge * np.trace(S) / p * np.eye(p))


def distances(Y, mu, L):
    D = np.atleast_2d(Y) - mu
    S_inv = np.linalg.inv(L @ L.T)
    return np.sqrt(np.sum((D @ S_inv) * D, axis=1))
