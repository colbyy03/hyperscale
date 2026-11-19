# expect: pinv of a (20, 4) matrix
import numpy as np


def pinv(A, rtol=1e-12):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    keep = s > rtol * s.max()
    s_inv = np.zeros_like(s)
    s_inv[keep] = 1.0 / s[keep]
    return (U * s_inv) @ Vt
