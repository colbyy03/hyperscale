import numpy as np


def steady_state(links, q, t_coolant):
    """Node temperatures (°C) of a thermal network at steady state.

    links: rows (i, j, g) with conductance g in W/K; j = -1 is the coolant at t_coolant.
    q: heat generated at each node, in W.
    """
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
        raise ValueError("some nodes have no path to the coolant, so their temperatures aren't determined")
    return np.linalg.solve(K, rhs)
