# expect: compare shapes first
import numpy as np


def numerical_jacobian(f, x, h=1e-6):
    x = np.asarray(x, dtype=float).copy()
    m = np.atleast_1d(f(x)).size
    J = np.zeros((m, x.size))
    for j in range(x.size):
        old = x[j]
        x[j] = old + h
        fp = np.atleast_1d(f(x))
        x[j] = old - h
        fm = np.atleast_1d(f(x))
        x[j] = old
        J[:, j] = (fp - fm) / (2 * h)
    return J


def check_jacobian(f, jac, x, tol=1e-6):
    J = np.asarray(jac(x), dtype=float)
    Jn = numerical_jacobian(f, x)
    rel = np.linalg.norm(J - Jn) / max(np.linalg.norm(J), np.linalg.norm(Jn), 1e-12)
    return bool(rel < tol), float(rel)
