import numpy as np


def project(B, a):
    """Project each vector in B (shape (d,) or (n, d)) onto the line through a. Returns (P, R)."""
    B = np.asarray(B, dtype=float)
    a = np.asarray(a, dtype=float)
    aa = a @ a
    if aa == 0:
        raise ValueError("can't project onto the zero vector")
    t = np.asarray((B @ a) / aa)  # the multiplier: one per vector
    P = t[..., None] * a
    return P, B - P
