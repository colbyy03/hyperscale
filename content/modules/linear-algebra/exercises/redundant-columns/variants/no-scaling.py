# expect: valve_frac isn't redundant
import numpy as np


def redundant_columns(X, names, rtol=1e-8):
    X = np.asarray(X, dtype=float)
    kept, redundant = [], []
    for j, name in enumerate(names):
        cand = kept + [j]
        if np.linalg.matrix_rank(X[:, cand], rtol=rtol) == len(cand):
            kept.append(j)
        else:
            redundant.append(name)
    return redundant
