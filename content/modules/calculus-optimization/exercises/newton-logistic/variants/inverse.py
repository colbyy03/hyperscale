# expect: not an explicit inverse
import numpy as np


def fit_logistic_newton(X, y, ridge=0.0, tol=1e-10, max_iter=50):
    n, d = X.shape
    w = np.zeros(d)
    norms = []
    for _ in range(max_iter + 1):
        p = 0.5 * (1.0 + np.tanh(X @ w / 2.0))
        g = X.T @ (p - y) / n + ridge * w
        norms.append(float(np.linalg.norm(g)))
        if norms[-1] < tol:
            break
        H = (X.T * (p * (1.0 - p))) @ X / n + ridge * np.eye(d)
        w = w - np.linalg.inv(H) @ g
    return w, norms
