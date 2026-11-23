import numpy as np


def project_simplex(v):
    """Euclidean projection of v onto {w >= 0, sum(w) = 1}."""
    v = np.asarray(v, dtype=float)
    u = np.sort(v)[::-1]
    css = np.cumsum(u) - 1.0
    j = np.arange(1, len(v) + 1)
    rho = np.nonzero(u - css / j > 0)[0][-1]
    theta = css[rho] / (rho + 1)
    return np.maximum(v - theta, 0.0)


def mixing_fractions(S, t, iters=2000):
    """Fractions f on the simplex minimizing 0.5 * ||S f - t||^2 / n, by projected gradient."""
    S = np.asarray(S, dtype=float)
    t = np.asarray(t, dtype=float)
    n, k = S.shape
    H = S.T @ S / n
    L = np.linalg.eigvalsh(H).max()
    f = np.full(k, 1.0 / k)
    for _ in range(iters):
        f = project_simplex(f - (S.T @ (S @ f - t) / n) / L)
    return f
