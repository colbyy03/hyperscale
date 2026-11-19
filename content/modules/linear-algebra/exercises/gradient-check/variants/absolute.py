# expect: compare relative, not absolute, errors
import numpy as np


def numerical_gradient(f, w, h=1e-5):
    w = np.asarray(w, dtype=float).copy()
    g = np.zeros_like(w)
    for i in range(w.size):
        old = w[i]
        w[i] = old + h
        fp = f(w)
        w[i] = old - h
        fm = f(w)
        w[i] = old
        g[i] = (fp - fm) / (2 * h)
    return g


def check_gradient(f, grad, w, tol=1e-6):
    err = np.linalg.norm(np.asarray(grad(w), dtype=float) - numerical_gradient(f, w))
    return bool(err < tol), float(err)
