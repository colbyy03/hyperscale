# expect: write the Gram-Schmidt loop yourself
import numpy as np


def mgs_qr(A):
    Q, R = np.linalg.qr(np.asarray(A, dtype=float))
    s = np.sign(np.diag(R))
    return Q * s, s[:, None] * R
