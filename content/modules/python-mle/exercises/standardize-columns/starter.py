import numpy as np


def standardize(X):
    """Return a copy of X whose columns have mean 0 and standard deviation 1.

    X: array of shape (n_samples, n_features)
    Constant columns (standard deviation 0) become all zeros.
    """
    X = np.asarray(X, dtype=float)
    # Your code here: one mean and one standard deviation per column.
    raise NotImplementedError("standardize is not written yet")
