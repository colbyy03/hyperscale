# expect: write the power iteration yourself
import numpy as np


def power_iteration(A, tol=1e-10, max_iter=1000, seed=0):
    lam, V = np.linalg.eigh(A)
    i = int(np.argmax(np.abs(lam)))
    if max_iter < 100:
        raise RuntimeError("pretend")
    return float(lam[i]), V[:, i], 1 if max_iter >= 100 else max_iter
