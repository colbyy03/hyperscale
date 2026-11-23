# expect: projection of (1.0, 0.4, 0.0) onto the simplex
import numpy as np


def project_simplex(v):
    v = np.asarray(v, dtype=float)
    u = np.sort(v)
    css = np.cumsum(u) - 1.0
    j = np.arange(1, len(v) + 1)
    idx = np.nonzero(u - css / j > 0)[0]
    rho = idx[-1] if len(idx) else 0
    return np.maximum(v - css[rho] / (rho + 1), 0.0)


def mixing_fractions(S, t, iters=2000):
    n, k = S.shape
    L = np.linalg.eigvalsh(S.T @ S / n).max()
    f = np.full(k, 1.0 / k)
    for _ in range(iters):
        f = project_simplex(f - (S.T @ (S @ f - t) / n) / L)
    return f
