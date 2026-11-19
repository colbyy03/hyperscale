# expect: projection of (2, 1) onto (3, 4)
import numpy as np


def project(B, a):
    B = np.asarray(B, dtype=float)
    a = np.asarray(a, dtype=float)
    n = np.linalg.norm(a)
    if n == 0:
        raise ValueError("zero vector")
    t = np.asarray((B @ a) / n)
    P = t[..., None] * a
    return P, B - P
