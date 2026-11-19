# expect: should rank first
import numpy as np


def most_similar(q, P, k):
    q = np.asarray(q, dtype=float)
    P = np.asarray(P, dtype=float)
    qc = q - q.mean()
    Pc = P - P.mean(axis=1, keepdims=True)
    norms = np.linalg.norm(Pc, axis=1)
    sims = np.full(len(P), np.inf)
    ok = norms > 0
    sims[ok] = (Pc[ok] @ qc) / (norms[ok] * np.linalg.norm(qc))
    order = np.argsort(sims, kind="stable")
    return order[np.isfinite(sims[order])][:k]
