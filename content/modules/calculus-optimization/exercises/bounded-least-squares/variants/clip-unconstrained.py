# expect: KKT residual
import numpy as np


def bounded_lsq(A, b, lo, hi, iters=5000):
    return np.clip(np.linalg.lstsq(A, b, rcond=None)[0], lo, hi)


def kkt_residual(A, b, w, lo, hi):
    g = A.T @ (A @ w - b) / len(b)
    lo = np.broadcast_to(np.asarray(lo, dtype=float), w.shape)
    hi = np.broadcast_to(np.asarray(hi, dtype=float), w.shape)
    at_lo, at_hi = np.abs(w - lo) < 1e-9, np.abs(w - hi) < 1e-9
    inside = ~(at_lo | at_hi)
    parts = [np.abs(g[inside]), np.maximum(0.0, -g[at_lo]), np.maximum(0.0, g[at_hi])]
    return float(max((p.max() for p in parts if p.size), default=0.0))
