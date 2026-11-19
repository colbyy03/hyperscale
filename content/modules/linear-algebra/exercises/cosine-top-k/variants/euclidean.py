# expect: should rank first
import numpy as np


def most_similar(q, P, k):
    q = np.asarray(q, dtype=float)
    P = np.asarray(P, dtype=float)
    flat = P.std(axis=1) == 0
    d = np.linalg.norm(P - q, axis=1)
    d[flat] = np.inf
    order = np.argsort(d, kind="stable")
    return order[np.isfinite(d[order])][:k]
