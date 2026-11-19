import numpy as np


def numerical_gradient(f, w, h=1e-5):
    """Central-difference estimate of the gradient of scalar f at w (w is not modified)."""
    w = np.asarray(w, dtype=float).copy()
    g = np.zeros_like(w)
    for i in range(w.size):
        old = w.flat[i]
        w.flat[i] = old + h
        fp = f(w)
        w.flat[i] = old - h
        fm = f(w)
        w.flat[i] = old
        g.flat[i] = (fp - fm) / (2 * h)
    return g


def check_gradient(f, grad, w, tol=1e-6):
    """Compare grad(w) with the numerical gradient: returns (ok, rel_error)."""
    g = np.asarray(grad(w), dtype=float)
    gn = numerical_gradient(f, w)
    rel = np.linalg.norm(g - gn) / max(np.linalg.norm(g), np.linalg.norm(gn), 1e-12)
    return bool(rel < tol), float(rel)
