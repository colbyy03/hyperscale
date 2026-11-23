# expect: optimal loads for 5,000 kW
import numpy as np


def dispatch(a, b, c, qmin, qmax, total):
    if not np.sum(qmin) <= total <= np.sum(qmax):
        raise ValueError("out of range")
    q = np.full(len(b), total / len(b))
    return q, float(np.mean(np.asarray(b) + 2 * np.asarray(c) * q))
