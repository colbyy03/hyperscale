# expect: pairwise_distances(A, B)
import numpy as np


def pairwise_distances(A, B):
    diff = np.asarray(A, float)[:, None, :] - np.asarray(B, float)[None, :, :]
    return np.sqrt((diff**2).sum(axis=0))
