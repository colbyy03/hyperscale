# expect: uses a Python for loop
import numpy as np


def project(B, a):
    B = np.asarray(B, dtype=float)
    a = np.asarray(a, dtype=float)
    if a @ a == 0:
        raise ValueError("zero vector")
    if B.ndim == 1:
        P = (B @ a) / (a @ a) * a
        return P, B - P
    P = np.empty_like(B)
    for i, b in enumerate(B):
        P[i] = (b @ a) / (a @ a) * a
    return P, B - P
