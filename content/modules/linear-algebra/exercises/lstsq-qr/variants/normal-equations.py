# expect: on the degree-10 fit
import numpy as np


def back_substitute(R, b):
    n = len(b)
    x = np.zeros(n)
    for k in range(n - 1, -1, -1):
        x[k] = (b[k] - R[k, k + 1 :] @ x[k + 1 :]) / R[k, k]
    return x


def lstsq_qr(X, y):
    # QR of the normal-equation matrix: still squares the condition number.
    Q, R = np.linalg.qr(X.T @ X)
    return back_substitute(R, Q.T @ (X.T @ y))
