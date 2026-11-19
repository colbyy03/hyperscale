# expect: use keepdims=True
import numpy as np


def logsumexp(x):
    x = np.asarray(x, dtype=float)
    m = x.max(axis=-1)
    return m + np.log(np.exp(x - m).sum(axis=-1))


def softmax(x):
    x = np.asarray(x, dtype=float)
    e = np.exp(x - x.max(axis=-1))
    return e / e.sum(axis=-1)
