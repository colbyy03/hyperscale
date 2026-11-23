# expect: the efficient chiller's load at 7,000 kW total
import numpy as np


def dispatch(a, b, c, qmin, qmax, total):
    b, c = np.asarray(b, dtype=float), np.asarray(c, dtype=float)
    if not np.sum(qmin) <= total <= np.sum(qmax):
        raise ValueError("out of range")
    lam = (total + np.sum(b / (2 * c))) / np.sum(1 / (2 * c))  # ignores the limits
    return (lam - b) / (2 * c), lam
