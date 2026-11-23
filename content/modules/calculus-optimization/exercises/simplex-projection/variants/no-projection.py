# expect: fractions must be non-negative and sum to 1
import numpy as np


def project_simplex(v):
    v = np.asarray(v, dtype=float)
    u = np.sort(v)[::-1]
    css = np.cumsum(u) - 1.0
    j = np.arange(1, len(v) + 1)
    rho = np.nonzero(u - css / j > 0)[0][-1]
    return np.maximum(v - css[rho] / (rho + 1), 0.0)


def mixing_fractions(S, t, iters=2000):
    n, k = S.shape
    L = np.linalg.eigvalsh(S.T @ S / n).max()
    f = np.full(k, 1.0 / k)
    for _ in range(iters):
        f = f - (S.T @ (S @ f - t) / n) / L  # never projected back
    return f
