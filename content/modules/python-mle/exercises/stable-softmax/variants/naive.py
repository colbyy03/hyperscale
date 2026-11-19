# expect: overflow in exp()
import numpy as np


def logsumexp(x):
    return np.log(np.exp(np.asarray(x, dtype=float)).sum(axis=-1))


def softmax(x):
    e = np.exp(np.asarray(x, dtype=float))
    return e / e.sum(axis=-1, keepdims=True)
