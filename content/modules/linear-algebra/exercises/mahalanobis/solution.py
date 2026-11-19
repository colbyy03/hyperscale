import numpy as np


def fit(X, ridge=1e-6):
    """Mean and Cholesky factor of the (slightly regularized) covariance of the rows of X."""
    X = np.asarray(X, dtype=float)
    mu = X.mean(axis=0)
    S = np.cov(X, rowvar=False)
    p = S.shape[0]
    S = S + ridge * np.trace(S) / p * np.eye(p)
    return mu, np.linalg.cholesky(S)


def distances(Y, mu, L):
    """Mahalanobis distance of each row of Y, using the Cholesky factor L (no explicit inverse)."""
    Z = np.linalg.solve(L, (np.atleast_2d(Y) - mu).T)
    return np.sqrt(np.sum(Z**2, axis=0))
