# expect: loop
import numpy as np


def pairwise_distances(A, B):
    A = np.asarray(A, dtype=float)
    B = np.asarray(B, dtype=float)
    out = np.empty((len(A), len(B)))
    for i in range(len(A)):
        out[i] = np.sqrt(((A[i] - B) ** 2).sum(axis=1))
    return out
