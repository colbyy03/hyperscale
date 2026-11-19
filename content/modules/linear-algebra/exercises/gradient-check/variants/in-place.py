# expect: w after numerical_gradient
import numpy as np


def numerical_gradient(f, w, h=1e-5):
    g = np.zeros_like(w, dtype=float)
    for i in range(w.size):
        w[i] += h
        fp = f(w)
        w[i] -= 2 * h
        fm = f(w)
        w[i] += h
        g[i] = (fp - fm) / (2 * h)
    return g


def check_gradient(f, grad, w, tol=1e-6):
    g = np.asarray(grad(w), dtype=float)
    gn = numerical_gradient(f, w)
    rel = np.linalg.norm(g - gn) / max(np.linalg.norm(g), np.linalg.norm(gn), 1e-12)
    return bool(rel < tol), float(rel)
