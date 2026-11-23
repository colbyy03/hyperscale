# expect: optimal loads for 5,000 kW
import numpy as np


def dispatch(a, b, c, qmin, qmax, total):
    b, c = np.asarray(b, dtype=float), np.asarray(c, dtype=float)
    if not np.sum(qmin) <= total <= np.sum(qmax):
        raise ValueError("out of range")
    lo, hi = -10.0, 10.0
    for _ in range(200):
        lam = 0.5 * (lo + hi)
        q = np.clip((lam - b) / c, qmin, qmax)  # marginal power taken as b + cQ
        if q.sum() < total:
            lo = lam
        else:
            hi = lam
    return np.clip((lam - b) / c, qmin, qmax), lam
