import numpy as np


def standardize(X):
    """Return a copy of X whose columns have mean 0 and standard deviation 1.

    X: array of shape (n_samples, n_features)
    Constant columns (standard deviation 0) become all zeros.
    """
    X = np.asarray(X, dtype=float)
    mu = X.mean(axis=0)  # shape (n_features,), broadcast across rows below
    sd = X.std(axis=0)  # population standard deviation (ddof=0)
    # Where sd == 0, X - mu is already 0, so dividing by 1 gives the required zeros.
    return (X - mu) / np.where(sd == 0, 1.0, sd)
