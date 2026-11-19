# expect: DID NOT RAISE
import numpy as np


def one_hot(labels, k):
    labels = np.asarray(labels)
    return (labels[:, None] == np.arange(k)).astype(float)
