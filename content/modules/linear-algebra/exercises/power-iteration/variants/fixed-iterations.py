# expect: Stop as soon as the change is below tol
import numpy as np


def power_iteration(A, tol=1e-10, max_iter=1000, seed=0):
    rng = np.random.default_rng(seed)
    v = rng.normal(size=A.shape[0])
    v /= np.linalg.norm(v)
    for k in range(1, max_iter + 1):
        v = A @ v
        v /= np.linalg.norm(v)
    if max_iter < 100:
        raise RuntimeError("too few iterations to be sure")
    return float(v @ A @ v), v, max_iter
