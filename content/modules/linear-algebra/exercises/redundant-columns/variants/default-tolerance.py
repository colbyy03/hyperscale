# expect: Pass rtol through to matrix_rank
import numpy as np


def redundant_columns(X, names, rtol=1e-8):
    X = np.asarray(X, dtype=float)
    norms = np.linalg.norm(X, axis=0)
    kept, redundant = [], []
    for j, name in enumerate(names):
        if norms[j] == 0:
            redundant.append(name)
            continue
        cand = kept + [j]
        if np.linalg.matrix_rank(X[:, cand] / norms[cand]) == len(cand):
            kept.append(j)
        else:
            redundant.append(name)
    return redundant
