# expect: projection of (1.0, 0.4, 0.0) onto the simplex
import numpy as np


def project_simplex(v):
    w = np.maximum(np.asarray(v, dtype=float), 0.0)
    return w / w.sum() if w.sum() > 0 else np.full(len(w), 1.0 / len(w))


def mixing_fractions(S, t, iters=2000):
    n, k = S.shape
    L = np.linalg.eigvalsh(S.T @ S / n).max()
    f = np.full(k, 1.0 / k)
    for _ in range(iters):
        f = project_simplex(f - (S.T @ (S @ f - t) / n) / L)
    return f
