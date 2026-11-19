# expect: one_hot([0, 0, 1], 5)
import numpy as np


def one_hot(labels, k):
    labels = np.asarray(labels)
    if np.any((labels < 0) | (labels >= k)):
        raise ValueError("bad label")
    return (np.arange(k)[:, None] == labels).astype(float)
