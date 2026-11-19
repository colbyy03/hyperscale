# expect: pinv(1e-13 * A)
import numpy as np


def pinv(A, rtol=1e-12):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    keep = s > rtol
    s_inv = np.zeros_like(s)
    s_inv[keep] = 1.0 / s[keep]
    return (Vt.T * s_inv) @ U.T
