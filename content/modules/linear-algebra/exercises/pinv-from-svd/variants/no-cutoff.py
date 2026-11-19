# expect: Treat singular values at or below
import numpy as np


def pinv(A, rtol=1e-12):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    with np.errstate(divide="ignore"):
        return (Vt.T * (1.0 / s)) @ U.T
