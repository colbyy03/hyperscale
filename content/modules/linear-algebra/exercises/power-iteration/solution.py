import numpy as np


def power_iteration(A, tol=1e-10, max_iter=1000, seed=0):
    """Dominant eigenvalue and unit eigenvector of a symmetric A. Returns (lam, v, iterations)."""
    A = np.asarray(A, dtype=float)
    rng = np.random.default_rng(seed)
    v = rng.normal(size=A.shape[0])
    v /= np.linalg.norm(v)
    for k in range(1, max_iter + 1):
        w = A @ v
        w /= np.linalg.norm(w)
        if min(np.linalg.norm(w - v), np.linalg.norm(w + v)) < tol:
            return float(w @ A @ w), w, k
        v = w
    raise RuntimeError(f"power iteration didn't converge in {max_iter} iterations")
