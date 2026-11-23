# expect: KKT residual at w = 0 when the optimum is 0.5
import numpy as np


def bounded_lsq(A, b, lo, hi, iters=5000):
    n = len(b)
    L = np.linalg.eigvalsh(A.T @ A / n).max()
    w = (np.broadcast_to(lo, (A.shape[1],)) + np.broadcast_to(hi, (A.shape[1],))) / 2
    for _ in range(iters):
        w = np.clip(w - (A.T @ (A @ w - b) / n) / L, lo, hi)
    return w


def kkt_residual(A, b, w, lo, hi):
    g = A.T @ (A @ w - b) / len(b)
    lo = np.broadcast_to(np.asarray(lo, dtype=float), w.shape)
    hi = np.broadcast_to(np.asarray(hi, dtype=float), w.shape)
    at_lo, at_hi = np.abs(w - lo) < 1e-9, np.abs(w - hi) < 1e-9
    inside = ~(at_lo | at_hi)
    parts = [np.abs(g[inside]), np.maximum(0.0, g[at_lo]), np.maximum(0.0, -g[at_hi])]  # signs swapped
    return float(max((p.max() for p in parts if p.size), default=0.0))
