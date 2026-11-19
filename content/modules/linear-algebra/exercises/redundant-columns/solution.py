import numpy as np


def redundant_columns(X, names, rtol=1e-8):
    """Names of the columns of X that are linear combinations of the columns before them."""
    X = np.asarray(X, dtype=float)
    norms = np.linalg.norm(X, axis=0)
    kept, redundant = [], []
    for j, name in enumerate(names):
        if norms[j] == 0:
            redundant.append(name)
            continue
        cand = kept + [j]
        Z = X[:, cand] / norms[cand]
        if np.linalg.matrix_rank(Z, rtol=rtol) == len(cand):
            kept.append(j)
        else:
            redundant.append(name)
    return redundant
