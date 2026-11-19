import numpy as np


def pinv(A, rtol=1e-12):
    """Moore-Penrose pseudoinverse via the SVD, dropping singular values <= rtol * s.max()."""
    U, s, Vt = np.linalg.svd(np.asarray(A, dtype=float), full_matrices=False)
    keep = s > rtol * s.max()
    s_inv = np.zeros_like(s)
    s_inv[keep] = 1.0 / s[keep]
    return (Vt.T * s_inv) @ U.T
