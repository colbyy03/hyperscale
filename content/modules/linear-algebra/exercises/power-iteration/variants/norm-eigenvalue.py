# expect: whose eigenvalues are −4, 1, 0.5
import numpy as np


def power_iteration(A, tol=1e-10, max_iter=1000, seed=0):
    rng = np.random.default_rng(seed)
    v = rng.normal(size=A.shape[0])
    v /= np.linalg.norm(v)
    for k in range(1, max_iter + 1):
        w = A @ v
        lam = np.linalg.norm(w)
        w /= lam
        if min(np.linalg.norm(w - v), np.linalg.norm(w + v)) < tol:
            return float(lam), w, k
        v = w
    raise RuntimeError("no convergence")
