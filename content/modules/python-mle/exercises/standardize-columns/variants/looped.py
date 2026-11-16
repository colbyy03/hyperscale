# expect: uses a Python for loop
import numpy as np


def standardize(X):
    X = np.asarray(X, dtype=float)
    Z = np.empty_like(X)
    for j in range(X.shape[1]):
        col = X[:, j]
        sd = col.std()
        Z[:, j] = (col - col.mean()) / (sd if sd > 0 else 1.0)
    return Z
