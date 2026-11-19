# expect: DID NOT RAISE
import numpy as np


def project(B, a):
    B = np.asarray(B, dtype=float)
    a = np.asarray(a, dtype=float)
    with np.errstate(invalid="ignore", divide="ignore"):
        t = np.asarray((B @ a) / (a @ a))
    P = t[..., None] * a
    return P, B - P
