# expect: that's a one-sided difference's accuracy
import numpy as np


def numerical_jacobian(f, x, h=1e-6):
    x = np.asarray(x, dtype=float).copy()
    f0 = np.atleast_1d(f(x))
    J = np.zeros((f0.size, x.size))
    for j in range(x.size):
        old = x[j]
        x[j] = old + h
        J[:, j] = (np.atleast_1d(f(x)) - f0) / h
        x[j] = old
    return J


def check_jacobian(f, jac, x, tol=1e-6):
    J = np.atleast_2d(np.asarray(jac(x), dtype=float))
    Jn = numerical_jacobian(f, x)
    if J.shape != Jn.shape:
        return False, float("inf")
    rel = np.linalg.norm(J - Jn) / max(np.linalg.norm(J), np.linalg.norm(Jn), 1e-12)
    return bool(rel < tol), float(rel)
