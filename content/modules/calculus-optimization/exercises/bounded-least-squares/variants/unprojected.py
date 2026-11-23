# expect: openings must stay within [0, 1]
import numpy as np


def bounded_lsq(A, b, lo, hi, iters=5000):
    n = len(b)
    L = np.linalg.eigvalsh(A.T @ A / n).max()
    w = np.full(A.shape[1], 0.5)
    for _ in range(iters):
        w = w - (A.T @ (A @ w - b) / n) / L
    return w


def kkt_residual(A, b, w, lo, hi):
    g = A.T @ (A @ w - b) / len(b)
    lo = np.broadcast_to(np.asarray(lo, dtype=float), w.shape)
    hi = np.broadcast_to(np.asarray(hi, dtype=float), w.shape)
    at_lo, at_hi = np.abs(w - lo) < 1e-9, np.abs(w - hi) < 1e-9
    inside = ~(at_lo | at_hi)
    parts = [np.abs(g[inside]), np.maximum(0.0, -g[at_lo]), np.maximum(0.0, g[at_hi])]
    return float(max((p.max() for p in parts if p.size), default=0.0))
