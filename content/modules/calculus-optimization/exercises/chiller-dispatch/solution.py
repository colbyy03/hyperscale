import numpy as np


def dispatch(a, b, c, qmin, qmax, total):
    """Minimum-power split of `total` cooling among chillers with P_i(Q) = a_i + b_i Q + c_i Q^2. Returns (loads, lam)."""
    b, c = np.asarray(b, dtype=float), np.asarray(c, dtype=float)
    qmin, qmax = np.asarray(qmin, dtype=float), np.asarray(qmax, dtype=float)
    if not qmin.sum() <= total <= qmax.sum():
        raise ValueError(f"a total of {total} kW is outside the plant's range [{qmin.sum()}, {qmax.sum()}] kW")
    lo = float((b + 2 * c * qmin).min()) - 1.0
    hi = float((b + 2 * c * qmax).max()) + 1.0
    for _ in range(200):
        lam = 0.5 * (lo + hi)
        q = np.clip((lam - b) / (2 * c), qmin, qmax)
        if q.sum() < total:
            lo = lam
        else:
            hi = lam
    lam = 0.5 * (lo + hi)
    return np.clip((lam - b) / (2 * c), qmin, qmax), lam
