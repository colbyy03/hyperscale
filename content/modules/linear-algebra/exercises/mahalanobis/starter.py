import numpy as np


def fit(X, ridge=1e-6):
    """Mean and Cholesky factor of the (slightly regularized) covariance of the rows of X."""
    raise NotImplementedError("fit is not written yet")


def distances(Y, mu, L):
    """Mahalanobis distance of each row of Y, using the Cholesky factor L (no explicit inverse)."""
    raise NotImplementedError("distances is not written yet")
