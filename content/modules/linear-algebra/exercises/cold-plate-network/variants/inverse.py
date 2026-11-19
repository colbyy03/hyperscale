# expect: not an explicit inverse
import numpy as np


def steady_state(links, q, t_coolant):
    q = np.asarray(q, dtype=float)
    n = len(q)
    K = np.zeros((n, n))
    rhs = q.copy()
    for i, j, g in np.asarray(links, dtype=float):
        i, j = int(i), int(j)
        K[i, i] += g
        if j < 0:
            rhs[i] += g * t_coolant
        else:
            K[j, j] += g
            K[i, j] -= g
            K[j, i] -= g
    if np.linalg.matrix_rank(K) < n:
        raise ValueError("singular")
    return np.linalg.inv(K) @ rhs
