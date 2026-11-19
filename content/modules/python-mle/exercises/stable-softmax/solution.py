import numpy as np


def logsumexp(x):
    """log(sum(exp(x))) over the last axis, without overflow."""
    x = np.asarray(x, dtype=float)
    m = x.max(axis=-1, keepdims=True)
    return (m + np.log(np.exp(x - m).sum(axis=-1, keepdims=True))).squeeze(-1)


def softmax(x):
    """exp(x) / sum(exp(x)) over the last axis, without overflow."""
    x = np.asarray(x, dtype=float)
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)
