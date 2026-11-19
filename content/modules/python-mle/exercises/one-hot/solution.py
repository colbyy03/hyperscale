import numpy as np


def one_hot(labels, k):
    """(n, k) float matrix with a 1.0 in each row's label column."""
    labels = np.asarray(labels)
    if np.any((labels < 0) | (labels >= k)):
        raise ValueError(f"labels must be in [0, {k})")
    return (labels[:, None] == np.arange(k)).astype(float)
