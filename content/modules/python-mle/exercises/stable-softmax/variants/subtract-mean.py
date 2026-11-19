# expect: overflow in exp()
import numpy as np


def logsumexp(x):
    x = np.asarray(x, dtype=float)
    m = x.mean(axis=-1, keepdims=True)
    return (m + np.log(np.exp(x - m).sum(axis=-1, keepdims=True))).squeeze(-1)


def softmax(x):
    x = np.asarray(x, dtype=float)
    e = np.exp(x - x.mean(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)
