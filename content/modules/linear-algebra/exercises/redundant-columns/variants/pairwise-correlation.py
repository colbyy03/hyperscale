# expect: so the last indicator adds nothing
import numpy as np


def redundant_columns(X, names, rtol=1e-8):
    """Flags a column only when it's (almost) perfectly correlated with one earlier column."""
    X = np.asarray(X, dtype=float)
    redundant = []
    for j, name in enumerate(names):
        col = X[:, j]
        if not col.any():
            redundant.append(name)
            continue
        for k in range(j):
            other = X[:, k]
            if other.std() == 0 or col.std() == 0:
                continue
            if abs(np.corrcoef(col, other)[0, 1]) > 1 - rtol:
                redundant.append(name)
                break
    return redundant
