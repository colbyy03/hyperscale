import numpy as np


def bounded_lsq(A, b, lo, hi, iters=5000):
    """Projected gradient for min 0.5 * ||A w - b||^2 / n subject to lo <= w <= hi."""
    A, b = np.asarray(A, dtype=float), np.asarray(b, dtype=float)
    n = len(b)
    lo = np.broadcast_to(np.asarray(lo, dtype=float), (A.shape[1],))
    hi = np.broadcast_to(np.asarray(hi, dtype=float), (A.shape[1],))
    L = np.linalg.eigvalsh(A.T @ A / n).max()
    w = (lo + hi) / 2
    for _ in range(iters):
        w = np.clip(w - (A.T @ (A @ w - b) / n) / L, lo, hi)
    return w


def kkt_residual(A, b, w, lo, hi):
    """Largest violation of the box KKT conditions at w (0 means optimal)."""
    g = A.T @ (A @ w - b) / len(b)
    lo = np.broadcast_to(np.asarray(lo, dtype=float), w.shape)
    hi = np.broadcast_to(np.asarray(hi, dtype=float), w.shape)
    at_lo = np.abs(w - lo) < 1e-9
    at_hi = np.abs(w - hi) < 1e-9
    inside = ~(at_lo | at_hi)
    parts = [np.abs(g[inside]), np.maximum(0.0, -g[at_lo]), np.maximum(0.0, g[at_hi])]
    return float(max((p.max() for p in parts if p.size), default=0.0))
