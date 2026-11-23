# expect: DID NOT RAISE
import numpy as np


def dispatch(a, b, c, qmin, qmax, total):
    b, c = np.asarray(b, dtype=float), np.asarray(c, dtype=float)
    lo, hi = -10.0, 10.0
    for _ in range(200):
        lam = 0.5 * (lo + hi)
        q = np.clip((lam - b) / (2 * c), qmin, qmax)
        if q.sum() < total:
            lo = lam
        else:
            hi = lam
    return np.clip((lam - b) / (2 * c), qmin, qmax), lam
