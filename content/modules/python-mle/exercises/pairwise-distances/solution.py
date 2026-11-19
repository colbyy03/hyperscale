import numpy as np


def pairwise_distances(A, B):
    """(n, m) Euclidean distances between the rows of A (n, d) and B (m, d)."""
    A = np.asarray(A, dtype=float)
    B = np.asarray(B, dtype=float)
    diff = A[:, None, :] - B[None, :, :]
    return np.sqrt((diff**2).sum(axis=-1))
