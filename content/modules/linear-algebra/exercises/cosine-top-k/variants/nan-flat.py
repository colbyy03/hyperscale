# expect: must not be returned
import numpy as np


def most_similar(q, P, k):
    q = np.asarray(q, dtype=float)
    P = np.asarray(P, dtype=float)
    qc = q - q.mean()
    Pc = P - P.mean(axis=1, keepdims=True)
    with np.errstate(invalid="ignore", divide="ignore"):
        sims = (Pc @ qc) / (np.linalg.norm(Pc, axis=1) * np.linalg.norm(qc))
    sims = np.nan_to_num(sims, nan=0.0)
    return np.argsort(-sims, kind="stable")[:k]
