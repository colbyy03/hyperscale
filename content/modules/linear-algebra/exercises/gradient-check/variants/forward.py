# expect: that's a one-sided difference's error
import numpy as np


def numerical_gradient(f, w, h=1e-5):
    w = np.asarray(w, dtype=float).copy()
    g = np.zeros_like(w)
    f0 = f(w)
    for i in range(w.size):
        old = w[i]
        w[i] = old + h
        g[i] = (f(w) - f0) / h
        w[i] = old
    return g


def check_gradient(f, grad, w, tol=1e-6):
    g = np.asarray(grad(w), dtype=float)
    gn = numerical_gradient(f, w)
    rel = np.linalg.norm(g - gn) / max(np.linalg.norm(g), np.linalg.norm(gn), 1e-12)
    return bool(rel < tol), float(rel)
