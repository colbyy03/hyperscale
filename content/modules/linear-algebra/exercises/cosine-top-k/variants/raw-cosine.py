# expect: should rank last
import numpy as np


def most_similar(q, P, k):
    q = np.asarray(q, dtype=float)
    P = np.asarray(P, dtype=float)
    norms = np.linalg.norm(P, axis=1)
    sims = np.full(len(P), -np.inf)
    ok = norms > 0
    sims[ok] = (P[ok] @ q) / (norms[ok] * np.linalg.norm(q))
    order = np.argsort(-sims, kind="stable")
    return order[np.isfinite(sims[order])][:k]
